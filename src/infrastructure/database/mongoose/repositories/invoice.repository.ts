// src/infrastructure/database/mongoose/repositories/invoice.repository.ts
import { injectable } from 'tsyringe';
import { Types } from 'mongoose';
import {
    IInvoiceRepository,
    AgingBucket,
    DashboardSummaryData,
} from '../../../../domain/repositories/IInvoiceRepository'; // Импортируем базовый интерфейс
import {
    Invoice,
    InvoiceStatus,
} from '../../../../domain/entities/invoice.entity';
import { InvoiceModel, IInvoiceDocument } from '../schemas/invoice.schema';
import { AppError } from '../../../../application/errors/AppError'; // Для возможных ошибок

// Расширяем базовый интерфейс для ясности
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    create(
        data: Omit<
            Invoice,
            | 'id'
            | 'customer'
            | 'createdAt'
            | 'updatedAt'
            | 'outstandingAmount'
            | 'isOverdue'
        >,
    ): Promise<Invoice>;
    findByInvoiceNumberAndCustomerId(
        invoiceNumber: string,
        customerId: string,
    ): Promise<Invoice | null>;
}

@injectable()
export class MongoInvoiceRepository implements IInvoiceRepositoryExtended {
    /**
     * Преобразует документ Mongoose в доменную сущность Invoice.
     * @param doc - Документ Mongoose.
     * @returns Экземпляр Invoice.
     */
    private mapToDomain(doc: IInvoiceDocument): Invoice {
        const obj = doc.toObject(); // Используем toObject с настроенным transform
        return new Invoice({
            id: obj.id,
            invoiceNumber: obj.invoiceNumber,
            customerId: obj.customerId, // customerId будет строкой после toObject
            issueDate: obj.issueDate,
            dueDate: obj.dueDate,
            totalAmount: obj.totalAmount,
            paidAmount: obj.paidAmount,
            status: obj.status as InvoiceStatus,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
        });
    }

    /**
     * Находит счет по его ID.
     * @param id - ID счета (строка ObjectId).
     * @returns Промис с найденным Invoice или null.
     */
    async findById(id: string): Promise<Invoice | null> {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        try {
            const doc = await InvoiceModel.findById(id).exec();
            return doc ? this.mapToDomain(doc) : null;
        } catch (error) {
            console.error(`Error finding invoice by ID ${id}:`, error);
            throw new AppError('Ошибка при поиске счета по ID', 500);
        }
    }

    /**
     * Находит счет по номеру и ID клиента.
     * @param invoiceNumber - Номер счета.
     * @param customerId - ID клиента (строка ObjectId).
     * @returns Промис с найденным Invoice или null.
     */
    async findByInvoiceNumberAndCustomerId(
        invoiceNumber: string,
        customerId: string,
    ): Promise<Invoice | null> {
        if (
            !invoiceNumber ||
            !customerId ||
            !customerId.match(/^[0-9a-fA-F]{24}$/)
        ) {
            console.warn(
                'Invalid input for findByInvoiceNumberAndCustomerId:',
                { invoiceNumber, customerId },
            );
            return null;
        }
        try {
            const customerObjectId = new Types.ObjectId(customerId);
            const doc = await InvoiceModel.findOne({
                invoiceNumber: invoiceNumber,
                customerId: customerObjectId,
            }).exec();
            return doc ? this.mapToDomain(doc) : null;
        } catch (error) {
            console.error(
                `Error finding invoice by number ${invoiceNumber} and customer ${customerId}:`,
                error,
            );
            throw new AppError(
                'Ошибка при поиске счета по номеру и клиенту',
                500,
            );
        }
    }

    /**
     * Создает новый счет.
     * @param data - Данные для создания счета.
     * @returns Промис с созданным Invoice.
     * @throws {AppError} Если счет с таким номером у данного клиента уже существует.
     */
    async create(
        data: Omit<
            Invoice,
            | 'id'
            | 'customer'
            | 'createdAt'
            | 'updatedAt'
            | 'outstandingAmount'
            | 'isOverdue'
        >,
    ): Promise<Invoice> {
        // Проверка на дубликат перед созданием
        const existing = await this.findByInvoiceNumberAndCustomerId(
            data.invoiceNumber,
            data.customerId,
        );
        if (existing) {
            throw new AppError(
                `Счет с номером ${data.invoiceNumber} для клиента ${data.customerId} уже существует.`,
                409,
            ); // 409 Conflict
        }

        try {
            const customerObjectId = new Types.ObjectId(data.customerId);
            const newInvoiceDoc = new InvoiceModel({
                invoiceNumber: data.invoiceNumber,
                customerId: customerObjectId, // Сохраняем как ObjectId
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount ?? 0,
                status: data.status ?? 'OPEN', // Статус по умолчанию OPEN
            });
            const savedDoc = await newInvoiceDoc.save();
            return this.mapToDomain(savedDoc);
        } catch (error: any) {
            // Обработка ошибок MongoDB (например, нарушение уникальности составного индекса, если он есть)
            console.error(
                `Error creating invoice ${data.invoiceNumber} for customer ${data.customerId}:`,
                error,
            );
            // Попробуем найти еще раз на случай гонки
            const raceExisting = await this.findByInvoiceNumberAndCustomerId(
                data.invoiceNumber,
                data.customerId,
            );
            if (raceExisting) {
                throw new AppError(
                    `Счет с номером ${data.invoiceNumber} для клиента ${data.customerId} уже существует (concurrency).`,
                    409,
                );
            }
            throw new AppError('Ошибка при создании счета', 500);
        }
    }

    /**
     * Рассчитывает сводку для дашборда.
     * @param currentDate - Дата, на которую рассчитывается сводка (по умолчанию текущая).
     * @returns Промис с данными для дашборда.
     */
    async getDashboardSummary(
        currentDate = new Date(),
    ): Promise<DashboardSummaryData> {
        // --- Код агрегации ---
        const pipeline = [
            { $match: { status: { $ne: 'PAID' } } },
            {
                $addFields: {
                    outstandingAmount: {
                        $subtract: ['$totalAmount', '$paidAmount'],
                    },
                    isOverdue: {
                        $cond: {
                            if: { $lt: ['$dueDate', currentDate] },
                            then: true,
                            else: false,
                        },
                    },
                    daysDifference: {
                        $dateDiff: {
                            startDate: '$dueDate',
                            endDate: currentDate,
                            unit: 'day',
                        },
                    },
                },
            },
            { $match: { outstandingAmount: { $gt: 0 } } },
            {
                $group: {
                    _id: null,
                    totalReceivables: { $sum: '$outstandingAmount' },
                    overdueReceivables: {
                        $sum: {
                            $cond: ['$isOverdue', '$outstandingAmount', 0],
                        },
                    },
                    agingData: {
                        $push: {
                            amount: '$outstandingAmount',
                            daysOverdue: {
                                $cond: ['$isOverdue', '$daysDifference', null],
                            },
                            isOverdue: '$isOverdue',
                        },
                    },
                },
            },
            // Если нет данных после $group, массив agingData будет пустым или отсутствовать
            {
                $unwind: {
                    path: '$agingData',
                    preserveNullAndEmptyArrays: true,
                },
            }, // Сохраняем документ, даже если agingData пуст
            {
                $addFields: {
                    // Добавляем bucket только если есть agingData
                    'agingData.bucket': {
                        $cond: {
                            if: { $ne: ['$agingData', null] }, // Проверяем, что agingData не null (из-за preserveNullAndEmptyArrays)
                            then: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $eq: [
                                                    '$agingData.isOverdue',
                                                    false,
                                                ],
                                            },
                                            then: 'Current',
                                        },
                                        {
                                            case: {
                                                $lte: [
                                                    '$agingData.daysOverdue',
                                                    30,
                                                ],
                                            },
                                            then: '1-30',
                                        },
                                        {
                                            case: {
                                                $lte: [
                                                    '$agingData.daysOverdue',
                                                    60,
                                                ],
                                            },
                                            then: '31-60',
                                        },
                                        {
                                            case: {
                                                $lte: [
                                                    '$agingData.daysOverdue',
                                                    90,
                                                ],
                                            },
                                            then: '61-90',
                                        },
                                        {
                                            case: {
                                                $gt: [
                                                    '$agingData.daysOverdue',
                                                    90,
                                                ],
                                            },
                                            then: '91+',
                                        },
                                    ],
                                    default: 'Error',
                                },
                            },
                            else: null, // Иначе bucket не определяем
                        },
                    },
                },
            },
            {
                $group: {
                    // Группируем по _id документа (он всегда null) и по bucket
                    _id: { mainId: '$_id', bucket: '$agingData.bucket' },
                    amount: { $sum: '$agingData.amount' }, // Сумма по бакету (будет 0 если bucket=null)
                    count: {
                        $sum: {
                            $cond: [{ $ne: ['$agingData.bucket', null] }, 1, 0],
                        },
                    }, // Считаем только непустые бакеты
                    // Переносим общие суммы
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                },
            },
            {
                $group: {
                    _id: '$_id.mainId', // Снова группируем в один документ
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                    agingStructure: {
                        $push: {
                            // Добавляем бакет, только если он не null
                            $cond: {
                                if: { $ne: ['$_id.bucket', null] },
                                then: {
                                    bucket: '$_id.bucket',
                                    amount: { $round: ['$amount', 2] },
                                    count: '$count',
                                },
                                else: '$$REMOVE', // Удаляем элемент из массива, если bucket null
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalReceivables: { $ifNull: ['$totalReceivables', 0] },
                    overdueReceivables: { $ifNull: ['$overdueReceivables', 0] },
                    agingStructure: { $ifNull: ['$agingStructure', []] },
                },
            },
        ];
        // --- Конец агрегации ---

        try {
            const result = await InvoiceModel.aggregate(pipeline).exec();

            if (result.length > 0) {
                const summary = result[0] as DashboardSummaryData;
                const standardBucketsForCheck = [
                    'Current',
                    '1-30',
                    '31-60',
                    '61-90',
                    '91+',
                ];
                const existingBuckets = summary.agingStructure.map(
                    (b) => b.bucket,
                );

                standardBucketsForCheck.forEach((stdBucket) => {
                    if (!existingBuckets.includes(stdBucket)) {
                        summary.agingStructure.push({
                            bucket: stdBucket,
                            amount: 0,
                            count: 0,
                        });
                    }
                });

                summary.agingStructure.sort(
                    (a, b) =>
                        standardBucketsForCheck.indexOf(a.bucket) -
                        standardBucketsForCheck.indexOf(b.bucket),
                );

                summary.totalReceivables = parseFloat(
                    summary.totalReceivables.toFixed(2),
                );
                summary.overdueReceivables = parseFloat(
                    summary.overdueReceivables.toFixed(2),
                );

                return summary;
            } else {
                // Если агрегация вернула пустой результат (вообще нет неоплаченных счетов)
                const defaultBuckets = [
                    'Current',
                    '1-30',
                    '31-60',
                    '61-90',
                    '91+',
                ];
                return {
                    totalReceivables: 0,
                    overdueReceivables: 0,
                    agingStructure: defaultBuckets.map((b) => ({
                        bucket: b,
                        amount: 0,
                        count: 0,
                    })),
                };
            }
        } catch (error) {
            console.error('Error during dashboard summary aggregation:', error);
            throw new AppError('Ошибка при расчете сводки для дашборда', 500);
        }
    }

    /**
     * Получает детализированный отчет по старению (не реализовано).
     */
    async getAgingReport(
        _buckets: number[],
        _asOfDate = new Date(),
    ): Promise<AgingBucket[]> {
        console.warn('getAgingReport not implemented');
        // Реализация потребует динамического построения $switch или $bucket оператора
        // на основе переданных buckets
        return [];
    }
}
