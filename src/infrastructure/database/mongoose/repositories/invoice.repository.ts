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

// Интерфейсы для фильтрации и пагинации
export interface ListInvoicesFilters {
    status?: string;
    debtWorkStatus?: string;
    serviceType?: string;
    manager?: string;
    customerId?: string;
    isOverdue?: boolean;
    minAmount?: number;
    maxAmount?: number;
    dueDateFrom?: Date;
    dueDateTo?: Date;
}

export interface ListInvoicesOptions {
    filters?: ListInvoicesFilters;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ListInvoicesResult {
    invoices: Invoice[];
    total: number;
    limit: number;
    offset: number;
}

// DTO для топ должников
export interface TopDebtorDto {
    customerId: string;
    customerName: string;
    customerInn?: string;
    totalDebt: number;
    overdueDebt: number;
    invoiceCount: number;
    oldestDebtDays: number;
}

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
            | 'getDaysOverdue'
            | 'calculateDebtWorkStatus'
            | 'applyPayment'
        >,
    ): Promise<Invoice>;
    findByInvoiceNumberAndCustomerId(
        invoiceNumber: string,
        customerId: string,
    ): Promise<Invoice | null>;
    updatePayment(
        id: string,
        paidAmount: number,
        actualPaymentDate?: Date,
    ): Promise<Invoice | null>;
    findAll(options: ListInvoicesOptions): Promise<ListInvoicesResult>;
    getTopDebtors(limit: number, asOfDate: Date): Promise<TopDebtorDto[]>;
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
            serviceStartDate: obj.serviceStartDate,
            serviceEndDate: obj.serviceEndDate,
            totalAmount: obj.totalAmount,
            paidAmount: obj.paidAmount,
            paymentTermDays: obj.paymentTermDays,
            actualPaymentDate: obj.actualPaymentDate,
            status: obj.status as InvoiceStatus,
            debtWorkStatus: obj.debtWorkStatus,
            serviceType: obj.serviceType,
            manager: obj.manager,
            lastContactDate: obj.lastContactDate,
            contactResult: obj.contactResult,
            notes: obj.notes,
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
     * Рассчитывает сводку для дашборда с расширенной аналитикой.
     * @param currentDate - Дата, на которую рассчитывается сводка (по умолчанию текущая).
     * @returns Промис с данными для дашборда.
     */
    async getDashboardSummary(
        currentDate = new Date(),
    ): Promise<DashboardSummaryData> {
        // --- Код агрегации ---
        const pipeline: any[] = [
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
                    totalInvoicesCount: { $sum: 1 },
                    overdueInvoicesCount: {
                        $sum: { $cond: ['$isOverdue', 1, 0] },
                    },
                    // Средний срок просрочки (только для просроченных)
                    averageDaysOverdue: {
                        $avg: {
                            $cond: [
                                '$isOverdue',
                                '$daysDifference',
                                null,
                            ],
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
                    // Переносим общие суммы и метрики
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                    totalInvoicesCount: { $first: '$totalInvoicesCount' },
                    overdueInvoicesCount: { $first: '$overdueInvoicesCount' },
                    averageDaysOverdue: { $first: '$averageDaysOverdue' },
                },
            },
            {
                $group: {
                    _id: '$_id.mainId', // Снова группируем в один документ
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                    totalInvoicesCount: { $first: '$totalInvoicesCount' },
                    overdueInvoicesCount: { $first: '$overdueInvoicesCount' },
                    averageDaysOverdue: { $first: '$averageDaysOverdue' },
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
                    totalInvoicesCount: { $ifNull: ['$totalInvoicesCount', 0] },
                    overdueInvoicesCount: { $ifNull: ['$overdueInvoicesCount', 0] },
                    averageDaysOverdue: { $ifNull: ['$averageDaysOverdue', 0] },
                    agingStructure: { $ifNull: ['$agingStructure', []] },
                },
            },
        ];
        // --- Конец агрегации ---

        try {
            const result = await InvoiceModel.aggregate(pipeline).exec();

            if (result.length > 0) {
                const summary = result[0] as any;
                const standardBucketsForCheck = [
                    'Current',
                    '1-30',
                    '31-60',
                    '61-90',
                    '91+',
                ];
                const existingBuckets = (summary.agingStructure || []).map(
                    (b: any) => b.bucket,
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
                    (a: any, b: any) =>
                        standardBucketsForCheck.indexOf(a.bucket) -
                        standardBucketsForCheck.indexOf(b.bucket),
                );

                // Рассчитываем дополнительные метрики
                const totalReceivables = parseFloat(
                    (summary.totalReceivables || 0).toFixed(2),
                );
                const overdueReceivables = parseFloat(
                    (summary.overdueReceivables || 0).toFixed(2),
                );
                const currentReceivables = parseFloat(
                    (totalReceivables - overdueReceivables).toFixed(2),
                );
                const overduePercentage =
                    totalReceivables > 0
                        ? parseFloat(
                              (
                                  (overdueReceivables / totalReceivables) *
                                  100
                              ).toFixed(2),
                          )
                        : 0;
                const averagePaymentDelayDays = parseFloat(
                    (summary.averageDaysOverdue || 0).toFixed(1),
                );

                const dashboardData: DashboardSummaryData = {
                    totalReceivables,
                    overdueReceivables,
                    overduePercentage,
                    currentReceivables,
                    averagePaymentDelayDays,
                    totalInvoicesCount: summary.totalInvoicesCount || 0,
                    overdueInvoicesCount: summary.overdueInvoicesCount || 0,
                    agingStructure: summary.agingStructure,
                };

                return dashboardData;
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
                    overduePercentage: 0,
                    currentReceivables: 0,
                    averagePaymentDelayDays: 0,
                    totalInvoicesCount: 0,
                    overdueInvoicesCount: 0,
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
     * Получает список счетов с фильтрацией и пагинацией
     * @param options - Опции фильтрации, сортировки и пагинации
     * @returns Список счетов и общее количество
     */
    async findAll(options: ListInvoicesOptions): Promise<ListInvoicesResult> {
        try {
            const {
                filters = {},
                limit = 50,
                offset = 0,
                sortBy = 'dueDate',
                sortOrder = 'asc',
            } = options;

            // Строим фильтр для MongoDB
            const query: any = {};

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.debtWorkStatus) {
                query.debtWorkStatus = filters.debtWorkStatus;
            }

            if (filters.serviceType) {
                query.serviceType = filters.serviceType;
            }

            if (filters.manager) {
                query.manager = { $regex: filters.manager, $options: 'i' }; // Case-insensitive
            }

            if (filters.customerId) {
                if (filters.customerId.match(/^[0-9a-fA-F]{24}$/)) {
                    query.customerId = new Types.ObjectId(filters.customerId);
                }
            }

            if (filters.isOverdue !== undefined) {
                if (filters.isOverdue) {
                    query.dueDate = { $lt: new Date() };
                    query.status = { $ne: 'PAID' };
                } else {
                    query.$or = [
                        { dueDate: { $gte: new Date() } },
                        { status: 'PAID' },
                    ];
                }
            }

            // Фильтр по сумме задолженности (расчетное поле)
            if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
                query.$expr = query.$expr || { $and: [] };
                const outstandingCalc = {
                    $subtract: ['$totalAmount', '$paidAmount'],
                };

                if (filters.minAmount !== undefined) {
                    query.$expr.$and.push({
                        $gte: [outstandingCalc, filters.minAmount],
                    });
                }

                if (filters.maxAmount !== undefined) {
                    query.$expr.$and.push({
                        $lte: [outstandingCalc, filters.maxAmount],
                    });
                }
            }

            // Фильтр по дате срока оплаты
            if (filters.dueDateFrom || filters.dueDateTo) {
                query.dueDate = {};
                if (filters.dueDateFrom) {
                    query.dueDate.$gte = filters.dueDateFrom;
                }
                if (filters.dueDateTo) {
                    query.dueDate.$lte = filters.dueDateTo;
                }
            }

            // Сортировка
            const sortOptions: any = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Выполняем запросы параллельно
            const [docs, total] = await Promise.all([
                InvoiceModel.find(query)
                    .sort(sortOptions)
                    .skip(offset)
                    .limit(limit)
                    .populate('customerId', 'name inn contactInfo')
                    .exec(),
                InvoiceModel.countDocuments(query).exec(),
            ]);

            const invoices = docs.map((doc) => this.mapToDomain(doc));

            return {
                invoices,
                total,
                limit,
                offset,
            };
        } catch (error) {
            console.error('Error finding invoices:', error);
            throw new AppError('Ошибка при получении списка счетов', 500);
        }
    }

    /**
     * Обновляет информацию об оплате для счета
     * @param id - ID счета
     * @param paidAmount - Новая сумма оплаты
     * @param actualPaymentDate - Дата фактической оплаты
     * @returns Обновленный счет или null
     */
    async updatePayment(
        id: string,
        paidAmount: number,
        actualPaymentDate?: Date,
    ): Promise<Invoice | null> {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }

        try {
            const doc = await InvoiceModel.findById(id).exec();
            if (!doc) return null;

            // Обновляем суммы и даты
            doc.paidAmount = paidAmount;
            if (actualPaymentDate) {
                doc.actualPaymentDate = actualPaymentDate;
            }

            // Обновляем статус
            if (paidAmount >= doc.totalAmount) {
                doc.status = 'PAID';
                doc.debtWorkStatus = 'CLOSED';
            } else if (doc.dueDate < new Date()) {
                doc.status = 'OVERDUE';
            } else {
                doc.status = 'OPEN';
            }

            const updatedDoc = await doc.save();
            return this.mapToDomain(updatedDoc);
        } catch (error) {
            console.error(`Error updating payment for invoice ${id}:`, error);
            throw new AppError('Ошибка при обновлении оплаты счета', 500);
        }
    }

    /**
     * Получает топ-N должников с наибольшей задолженностью
     * @param limit - Количество должников в топе
     * @param asOfDate - Дата расчета
     * @returns Массив топ должников
     */
    async getTopDebtors(
        limit: number,
        asOfDate: Date = new Date(),
    ): Promise<TopDebtorDto[]> {
        try {
            const pipeline: any[] = [
                // Берем только неоплаченные счета
                { $match: { status: { $ne: 'PAID' } } },
                // Вычисляем остаток задолженности
                {
                    $addFields: {
                        outstandingAmount: {
                            $subtract: ['$totalAmount', '$paidAmount'],
                        },
                        isOverdue: {
                            $cond: {
                                if: { $lt: ['$dueDate', asOfDate] },
                                then: true,
                                else: false,
                            },
                        },
                        daysOverdue: {
                            $cond: {
                                if: { $lt: ['$dueDate', asOfDate] },
                                then: {
                                    $dateDiff: {
                                        startDate: '$dueDate',
                                        endDate: asOfDate,
                                        unit: 'day',
                                    },
                                },
                                else: 0,
                            },
                        },
                    },
                },
                // Фильтруем только те, у кого есть задолженность
                { $match: { outstandingAmount: { $gt: 0 } } },
                // Группируем по клиенту
                {
                    $group: {
                        _id: '$customerId',
                        totalDebt: { $sum: '$outstandingAmount' },
                        overdueDebt: {
                            $sum: {
                                $cond: ['$isOverdue', '$outstandingAmount', 0],
                            },
                        },
                        invoiceCount: { $sum: 1 },
                        oldestDebtDays: { $max: '$daysOverdue' },
                    },
                },
                // Сортируем по общей задолженности (по убыванию)
                { $sort: { totalDebt: -1 } },
                // Ограничиваем количество
                { $limit: limit },
                // Подтягиваем данные о клиенте
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customer',
                    },
                },
                // Разворачиваем массив customer
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                // Формируем финальный объект
                {
                    $project: {
                        _id: 0,
                        customerId: { $toString: '$_id' },
                        customerName: {
                            $ifNull: ['$customer.name', 'Unknown Customer'],
                        },
                        customerInn: '$customer.inn',
                        totalDebt: { $round: ['$totalDebt', 2] },
                        overdueDebt: { $round: ['$overdueDebt', 2] },
                        invoiceCount: 1,
                        oldestDebtDays: 1,
                    },
                },
            ];

            const result = await InvoiceModel.aggregate(pipeline).exec();
            return result as TopDebtorDto[];
        } catch (error) {
            console.error('Error getting top debtors:', error);
            throw new AppError('Ошибка при получении топ должников', 500);
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
