"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoInvoiceRepository = void 0;
// src/infrastructure/database/mongoose/repositories/invoice.repository.ts
const tsyringe_1 = require("tsyringe");
const mongoose_1 = require("mongoose");
const invoice_entity_1 = require("../../../../domain/entities/invoice.entity");
const invoice_schema_1 = require("../schemas/invoice.schema");
const AppError_1 = require("../../../../application/errors/AppError"); // Для возможных ошибок
let MongoInvoiceRepository = class MongoInvoiceRepository {
    /**
     * Преобразует документ Mongoose в доменную сущность Invoice.
     * @param doc - Документ Mongoose.
     * @returns Экземпляр Invoice.
     */
    mapToDomain(doc) {
        const obj = doc.toObject(); // Используем toObject с настроенным transform
        return new invoice_entity_1.Invoice({
            id: obj.id,
            invoiceNumber: obj.invoiceNumber,
            customerId: obj.customerId, // customerId будет строкой после toObject
            issueDate: obj.issueDate,
            dueDate: obj.dueDate,
            totalAmount: obj.totalAmount,
            paidAmount: obj.paidAmount,
            status: obj.status,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
        });
    }
    /**
     * Находит счет по его ID.
     * @param id - ID счета (строка ObjectId).
     * @returns Промис с найденным Invoice или null.
     */
    async findById(id) {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        try {
            const doc = await invoice_schema_1.InvoiceModel.findById(id).exec();
            return doc ? this.mapToDomain(doc) : null;
        }
        catch (error) {
            console.error(`Error finding invoice by ID ${id}:`, error);
            throw new AppError_1.AppError('Ошибка при поиске счета по ID', 500);
        }
    }
    /**
     * Находит счет по номеру и ID клиента.
     * @param invoiceNumber - Номер счета.
     * @param customerId - ID клиента (строка ObjectId).
     * @returns Промис с найденным Invoice или null.
     */
    async findByInvoiceNumberAndCustomerId(invoiceNumber, customerId) {
        if (!invoiceNumber ||
            !customerId ||
            !customerId.match(/^[0-9a-fA-F]{24}$/)) {
            console.warn('Invalid input for findByInvoiceNumberAndCustomerId:', { invoiceNumber, customerId });
            return null;
        }
        try {
            const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
            const doc = await invoice_schema_1.InvoiceModel.findOne({
                invoiceNumber: invoiceNumber,
                customerId: customerObjectId,
            }).exec();
            return doc ? this.mapToDomain(doc) : null;
        }
        catch (error) {
            console.error(`Error finding invoice by number ${invoiceNumber} and customer ${customerId}:`, error);
            throw new AppError_1.AppError('Ошибка при поиске счета по номеру и клиенту', 500);
        }
    }
    /**
     * Создает новый счет.
     * @param data - Данные для создания счета.
     * @returns Промис с созданным Invoice.
     * @throws {AppError} Если счет с таким номером у данного клиента уже существует.
     */
    async create(data) {
        // Проверка на дубликат перед созданием
        const existing = await this.findByInvoiceNumberAndCustomerId(data.invoiceNumber, data.customerId);
        if (existing) {
            throw new AppError_1.AppError(`Счет с номером ${data.invoiceNumber} для клиента ${data.customerId} уже существует.`, 409); // 409 Conflict
        }
        try {
            const customerObjectId = new mongoose_1.Types.ObjectId(data.customerId);
            const newInvoiceDoc = new invoice_schema_1.InvoiceModel({
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
        }
        catch (error) {
            // Обработка ошибок MongoDB (например, нарушение уникальности составного индекса, если он есть)
            console.error(`Error creating invoice ${data.invoiceNumber} for customer ${data.customerId}:`, error);
            // Попробуем найти еще раз на случай гонки
            const raceExisting = await this.findByInvoiceNumberAndCustomerId(data.invoiceNumber, data.customerId);
            if (raceExisting) {
                throw new AppError_1.AppError(`Счет с номером ${data.invoiceNumber} для клиента ${data.customerId} уже существует (concurrency).`, 409);
            }
            throw new AppError_1.AppError('Ошибка при создании счета', 500);
        }
    }
    /**
     * Рассчитывает сводку для дашборда.
     * @param currentDate - Дата, на которую рассчитывается сводка (по умолчанию текущая).
     * @returns Промис с данными для дашборда.
     */
    async getDashboardSummary(currentDate = new Date()) {
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
            const result = await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec();
            if (result.length > 0) {
                const summary = result[0];
                const standardBucketsForCheck = [
                    'Current',
                    '1-30',
                    '31-60',
                    '61-90',
                    '91+',
                ];
                const existingBuckets = summary.agingStructure.map((b) => b.bucket);
                standardBucketsForCheck.forEach((stdBucket) => {
                    if (!existingBuckets.includes(stdBucket)) {
                        summary.agingStructure.push({
                            bucket: stdBucket,
                            amount: 0,
                            count: 0,
                        });
                    }
                });
                summary.agingStructure.sort((a, b) => standardBucketsForCheck.indexOf(a.bucket) -
                    standardBucketsForCheck.indexOf(b.bucket));
                summary.totalReceivables = parseFloat(summary.totalReceivables.toFixed(2));
                summary.overdueReceivables = parseFloat(summary.overdueReceivables.toFixed(2));
                return summary;
            }
            else {
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
        }
        catch (error) {
            console.error('Error during dashboard summary aggregation:', error);
            throw new AppError_1.AppError('Ошибка при расчете сводки для дашборда', 500);
        }
    }
    /**
     * Получает детализированный отчет по старению (не реализовано).
     */
    async getAgingReport(_buckets, _asOfDate = new Date()) {
        console.warn('getAgingReport not implemented');
        // Реализация потребует динамического построения $switch или $bucket оператора
        // на основе переданных buckets
        return [];
    }
};
exports.MongoInvoiceRepository = MongoInvoiceRepository;
exports.MongoInvoiceRepository = MongoInvoiceRepository = __decorate([
    (0, tsyringe_1.injectable)()
], MongoInvoiceRepository);
//# sourceMappingURL=invoice.repository.js.map