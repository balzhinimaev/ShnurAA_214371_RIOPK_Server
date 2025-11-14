"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoInvoiceRepository = void 0;
// src/infrastructure/database/mongoose/repositories/invoice.repository.ts
const tsyringe_1 = require("tsyringe");
const mongoose_1 = require("mongoose");
const invoice_entity_1 = require("../../../../domain/entities/invoice.entity");
const customer_entity_1 = require("../../../../domain/entities/customer.entity");
const invoice_schema_1 = require("../schemas/invoice.schema");
const AppError_1 = require("../../../../application/errors/AppError"); // Для возможных ошибок
const customers_overdue_filters_dto_1 = require("../../../../application/dtos/reports/customers-overdue-filters.dto");
let MongoInvoiceRepository = class MongoInvoiceRepository {
    /**
     * Преобразует документ Mongoose в доменную сущность Invoice.
     * @param doc - Документ Mongoose.
     * @returns Экземпляр Invoice.
     */
    mapToDomain(doc) {
        // Если doc уже простой объект (из lean()), используем его напрямую
        // Иначе используем toObject() или normalizeAggregateResult для агрегаций
        let obj;
        if (doc && typeof doc.toObject === 'function') {
            obj = doc.toObject({ virtuals: true });
        }
        else if (doc && typeof doc === 'object') {
            obj = doc;
        }
        else {
            obj = this.normalizeAggregateResult(doc);
        }
        // Обработка populate для customerId
        let customer = undefined;
        let customerId;
        // Проверяем, был ли customerId populate
        // После lean() + populate customerId будет объектом с данными клиента
        if (obj.customerId && typeof obj.customerId === 'object') {
            const customerObj = obj.customerId;
            // Проверяем, что это не просто ObjectId, а объект с данными (есть name или _id)
            if (customerObj.name || customerObj._id) {
                // Это populate данные
                customerId = customerObj._id?.toString() || customerObj.id?.toString() || '';
                if (customerObj.name) {
                    customer = new customer_entity_1.Customer({
                        id: customerId,
                        name: customerObj.name || '',
                        unp: customerObj.unp || undefined,
                        contactInfo: customerObj.contactInfo || undefined,
                        createdAt: customerObj.createdAt ? new Date(customerObj.createdAt) : new Date(),
                        updatedAt: customerObj.updatedAt ? new Date(customerObj.updatedAt) : new Date(),
                    });
                }
            }
            else {
                // Это просто ObjectId
                customerId = customerObj.toString();
            }
        }
        else {
            // customerId это просто строка
            customerId = obj.customerId?.toString() || '';
        }
        return new invoice_entity_1.Invoice({
            id: obj._id?.toString() || obj.id?.toString() || '',
            invoiceNumber: obj.invoiceNumber,
            customerId: customerId,
            customer: customer, // Добавляем populate данные
            issueDate: obj.issueDate,
            dueDate: obj.dueDate,
            serviceStartDate: obj.serviceStartDate,
            serviceEndDate: obj.serviceEndDate,
            totalAmount: obj.totalAmount,
            paidAmount: obj.paidAmount,
            paymentTermDays: obj.paymentTermDays,
            actualPaymentDate: obj.actualPaymentDate,
            status: obj.status,
            debtWorkStatus: obj.debtWorkStatus,
            serviceType: obj.serviceType,
            manager: obj.manager,
            contractNumber: obj.contractNumber, // Добавляем contractNumber
            lastContactDate: obj.lastContactDate,
            contactResult: obj.contactResult,
            notes: obj.notes,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
        });
    }
    normalizeAggregateResult(doc) {
        if (!doc) {
            throw new AppError_1.AppError('Ошибка при преобразовании данных счета', 500);
        }
        const clone = { ...doc };
        const toIdString = (value) => {
            if (!value)
                return undefined;
            if (typeof value === 'string')
                return value;
            if (value instanceof mongoose_1.Types.ObjectId)
                return value.toString();
            if (typeof value.toHexString === 'function') {
                return value.toHexString();
            }
            if (value._id) {
                return toIdString(value._id);
            }
            if (value.id) {
                return toIdString(value.id);
            }
            if (typeof value.toString === 'function') {
                const result = value.toString();
                return result === '[object Object]' ? undefined : result;
            }
            return undefined;
        };
        const normalizedId = toIdString(clone.id) ?? toIdString(clone._id);
        if (normalizedId) {
            clone.id = normalizedId;
        }
        const normalizedCustomerId = toIdString(clone.customerId);
        if (normalizedCustomerId) {
            clone.customerId = normalizedCustomerId;
        }
        if (Array.isArray(clone.customerData) &&
            clone.customerData.length > 0) {
            const customerDoc = clone.customerData[0];
            const customerIdFromDoc = toIdString(customerDoc);
            if (customerIdFromDoc) {
                clone.customerId = customerIdFromDoc;
            }
        }
        delete clone._id;
        delete clone.customerData;
        delete clone.__v;
        return clone;
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
                serviceStartDate: data.serviceStartDate,
                serviceEndDate: data.serviceEndDate,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount ?? 0,
                paymentTermDays: data.paymentTermDays ?? 30, // Default to 30 days if not provided
                actualPaymentDate: data.actualPaymentDate,
                status: data.status ?? 'OPEN', // Статус по умолчанию OPEN
                debtWorkStatus: data.debtWorkStatus,
                serviceType: data.serviceType,
                manager: data.manager,
                contractNumber: data.contractNumber,
                notes: data.notes,
            });
            const savedDoc = await newInvoiceDoc.save();
            // Если счет создается с уже имеющейся оплатой, создаем запись в истории платежей
            if (data.paidAmount && data.paidAmount > 0 && data.actualPaymentDate) {
                const { PaymentHistoryModel } = await Promise.resolve().then(() => __importStar(require('../schemas/payment-history.schema')));
                const isOnTime = data.actualPaymentDate <= data.dueDate;
                let daysDelay = 0;
                if (!isOnTime) {
                    const diffTime = data.actualPaymentDate.getTime() - data.dueDate.getTime();
                    daysDelay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                await PaymentHistoryModel.create({
                    invoiceId: savedDoc._id,
                    amount: data.paidAmount,
                    paymentDate: data.actualPaymentDate,
                    isOnTime: isOnTime,
                    daysDelay: daysDelay,
                });
            }
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
     * Рассчитывает показатели на основе истории платежей
     * @returns Метрики платежей: средний срок оплаты, сумма платежей в срок, процент просроченных платежей
     */
    async calculatePaymentMetrics() {
        try {
            const { PaymentHistoryModel } = await Promise.resolve().then(() => __importStar(require('../schemas/payment-history.schema')));
            // Получаем все платежи с информацией о счетах
            const payments = await PaymentHistoryModel.aggregate([
                {
                    $lookup: {
                        from: 'invoices',
                        localField: 'invoiceId',
                        foreignField: '_id',
                        as: 'invoice',
                    },
                },
                {
                    $unwind: '$invoice',
                },
                {
                    $addFields: {
                        // Вычисляем количество дней от выставления счета до оплаты
                        paymentDays: {
                            $dateDiff: {
                                startDate: '$invoice.issueDate',
                                endDate: '$paymentDate',
                                unit: 'day',
                            },
                        },
                    },
                },
            ]).exec();
            if (payments.length === 0) {
                return {
                    averagePaymentDays: 0,
                    onTimePaymentsAmount: 0,
                    overduePaymentsPercentage: 0,
                };
            }
            // Средний срок оплаты (от выставления до оплаты)
            const totalPaymentDays = payments.reduce((sum, p) => sum + (p.paymentDays || 0), 0);
            const averagePaymentDays = totalPaymentDays / payments.length;
            // Сумма платежей в срок
            const onTimePaymentsAmount = payments
                .filter((p) => p.isOnTime)
                .reduce((sum, p) => sum + p.amount, 0);
            // Общая сумма всех платежей
            const totalPaymentsAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            // Процент просроченных платежей
            const overduePaymentsAmount = totalPaymentsAmount - onTimePaymentsAmount;
            const overduePaymentsPercentage = totalPaymentsAmount > 0
                ? parseFloat(((overduePaymentsAmount / totalPaymentsAmount) *
                    100).toFixed(2))
                : 0;
            return {
                averagePaymentDays: parseFloat(averagePaymentDays.toFixed(1)),
                onTimePaymentsAmount: parseFloat(onTimePaymentsAmount.toFixed(2)),
                overduePaymentsPercentage: overduePaymentsPercentage,
            };
        }
        catch (error) {
            console.error('Error calculating payment metrics:', error);
            return {
                averagePaymentDays: 0,
                onTimePaymentsAmount: 0,
                overduePaymentsPercentage: 0,
            };
        }
    }
    /**
     * Рассчитывает показатели оборачиваемости ДЗ за период (текущий месяц)
     * Согласно требованиям: оборачиваемость = выручка за период / средняя ДЗ
     * Средняя ДЗ = (ДЗ на начало периода + ДЗ на конец периода) / 2
     *
     * @param currentDate - Текущая дата расчета
     * @returns Метрики оборачиваемости
     */
    async calculateTurnoverMetrics(currentDate) {
        try {
            // Определяем период: текущий месяц (с начала месяца до текущей даты)
            const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Первый день текущего месяца
            const periodEnd = currentDate;
            // 1. Рассчитываем ДЗ на начало периода (начало месяца)
            // ДЗ на начало = сумма всех неоплаченных остатков счетов, созданных до начала периода
            const receivablesAtStartPipeline = [
                {
                    $match: {
                        issueDate: { $lt: periodStart }, // Счета, созданные до начала периода
                        status: { $ne: 'PAID' }, // Не полностью оплаченные
                    },
                },
                {
                    $addFields: {
                        outstandingAmount: {
                            $subtract: ['$totalAmount', '$paidAmount'],
                        },
                    },
                },
                {
                    $match: { outstandingAmount: { $gt: 0 } },
                },
                {
                    $group: {
                        _id: null,
                        totalReceivablesAtStart: {
                            $sum: '$outstandingAmount',
                        },
                    },
                },
            ];
            const receivablesAtStartResult = await invoice_schema_1.InvoiceModel.aggregate(receivablesAtStartPipeline).exec();
            const receivablesAtStart = receivablesAtStartResult.length > 0
                ? receivablesAtStartResult[0].totalReceivablesAtStart || 0
                : 0;
            // 2. Рассчитываем ДЗ на конец периода (текущая дата)
            // Используем ту же логику, что и в getDashboardSummary
            const receivablesAtEndPipeline = [
                {
                    $match: {
                        status: { $ne: 'PAID' },
                    },
                },
                {
                    $addFields: {
                        outstandingAmount: {
                            $subtract: ['$totalAmount', '$paidAmount'],
                        },
                    },
                },
                {
                    $match: { outstandingAmount: { $gt: 0 } },
                },
                {
                    $group: {
                        _id: null,
                        totalReceivablesAtEnd: {
                            $sum: '$outstandingAmount',
                        },
                    },
                },
            ];
            const receivablesAtEndResult = await invoice_schema_1.InvoiceModel.aggregate(receivablesAtEndPipeline).exec();
            const receivablesAtEnd = receivablesAtEndResult.length > 0
                ? receivablesAtEndResult[0].totalReceivablesAtEnd || 0
                : 0;
            // 3. Рассчитываем среднюю ДЗ
            const averageReceivables = (receivablesAtStart + receivablesAtEnd) / 2;
            // 4. Рассчитываем выручку за период
            // Выручка = сумма всех счетов (totalAmount), созданных в периоде
            const revenuePipeline = [
                {
                    $match: {
                        issueDate: {
                            $gte: periodStart,
                            $lte: periodEnd,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' },
                    },
                },
            ];
            const revenueResult = await invoice_schema_1.InvoiceModel.aggregate(revenuePipeline).exec();
            const periodRevenue = revenueResult.length > 0
                ? revenueResult[0].totalRevenue || 0
                : 0;
            // 5. Рассчитываем оборачиваемость ДЗ
            // Оборачиваемость = выручка за период / средняя ДЗ
            // Если средняя ДЗ = 0, то оборачиваемость = 0 (избегаем деления на ноль)
            const turnoverRatio = averageReceivables > 0
                ? parseFloat((periodRevenue / averageReceivables).toFixed(2))
                : 0;
            return {
                averageReceivables: parseFloat(averageReceivables.toFixed(2)),
                turnoverRatio,
                periodRevenue: parseFloat(periodRevenue.toFixed(2)),
            };
        }
        catch (error) {
            console.error('Error calculating turnover metrics:', error);
            // В случае ошибки возвращаем нулевые значения
            return {
                averageReceivables: 0,
                turnoverRatio: 0,
                periodRevenue: 0,
            };
        }
    }
    /**
     * Рассчитывает сводку для дашборда с расширенной аналитикой.
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
                const existingBuckets = (summary.agingStructure || []).map((b) => b.bucket);
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
                // Рассчитываем дополнительные метрики
                const totalReceivables = parseFloat((summary.totalReceivables || 0).toFixed(2));
                const overdueReceivables = parseFloat((summary.overdueReceivables || 0).toFixed(2));
                const currentReceivables = parseFloat((totalReceivables - overdueReceivables).toFixed(2));
                const overduePercentage = totalReceivables > 0
                    ? parseFloat(((overdueReceivables / totalReceivables) *
                        100).toFixed(2))
                    : 0;
                const averagePaymentDelayDays = parseFloat((summary.averageDaysOverdue || 0).toFixed(1));
                // Рассчитываем показатели оборачиваемости ДЗ
                const periodMetrics = await this.calculateTurnoverMetrics(currentDate);
                // Рассчитываем показатели на основе истории платежей
                const paymentMetrics = await this.calculatePaymentMetrics();
                const dashboardData = {
                    totalReceivables,
                    overdueReceivables,
                    overduePercentage,
                    currentReceivables,
                    averagePaymentDelayDays,
                    totalInvoicesCount: summary.totalInvoicesCount || 0,
                    overdueInvoicesCount: summary.overdueInvoicesCount || 0,
                    agingStructure: summary.agingStructure,
                    averageReceivables: periodMetrics.averageReceivables,
                    turnoverRatio: periodMetrics.turnoverRatio,
                    periodRevenue: periodMetrics.periodRevenue,
                    averagePaymentDays: paymentMetrics.averagePaymentDays,
                    onTimePaymentsAmount: paymentMetrics.onTimePaymentsAmount,
                    overduePaymentsPercentage: paymentMetrics.overduePaymentsPercentage,
                };
                return dashboardData;
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
                // Рассчитываем показатели оборачиваемости даже если нет текущей ДЗ
                const periodMetrics = await this.calculateTurnoverMetrics(currentDate);
                // Рассчитываем показатели на основе истории платежей
                const paymentMetrics = await this.calculatePaymentMetrics();
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
                    averageReceivables: periodMetrics.averageReceivables,
                    turnoverRatio: periodMetrics.turnoverRatio,
                    periodRevenue: periodMetrics.periodRevenue,
                    averagePaymentDays: paymentMetrics.averagePaymentDays,
                    onTimePaymentsAmount: paymentMetrics.onTimePaymentsAmount,
                    overduePaymentsPercentage: paymentMetrics.overduePaymentsPercentage,
                };
            }
        }
        catch (error) {
            console.error('Error during dashboard summary aggregation:', error);
            throw new AppError_1.AppError('Ошибка при расчете сводки для дашборда', 500);
        }
    }
    /**
     * Получает список счетов с фильтрацией по дням просрочки (через aggregation)
     * @param options - Опции фильтрации, сортировки и пагинации
     * @returns Список счетов и общее количество
     */
    async findAllWithDaysOverdueFilter(options) {
        try {
            const { filters = {}, limit = 50, offset = 0, sortBy = 'dueDate', sortOrder = 'asc', } = options;
            const currentDate = new Date();
            const pipeline = [];
            // Базовая фильтрация
            const matchStage = {};
            if (filters.status) {
                matchStage.status = filters.status;
            }
            if (filters.debtWorkStatus) {
                matchStage.debtWorkStatus = filters.debtWorkStatus;
            }
            if (filters.serviceType) {
                matchStage.serviceType = filters.serviceType;
            }
            if (filters.manager) {
                matchStage.manager = { $regex: filters.manager, $options: 'i' };
            }
            if (filters.customerId) {
                if (filters.customerId.match(/^[0-9a-fA-F]{24}$/)) {
                    matchStage.customerId = new mongoose_1.Types.ObjectId(filters.customerId);
                }
            }
            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }
            // Вычисляем дни просрочки и остаток задолженности
            pipeline.push({
                $addFields: {
                    outstandingAmount: {
                        $subtract: ['$totalAmount', '$paidAmount'],
                    },
                    daysOverdue: {
                        $cond: {
                            if: { $lt: ['$dueDate', currentDate] },
                            then: {
                                $dateDiff: {
                                    startDate: '$dueDate',
                                    endDate: currentDate,
                                    unit: 'day',
                                },
                            },
                            else: 0,
                        },
                    },
                },
            });
            // Фильтр по дням просрочки
            const daysOverdueFilter = {};
            if (filters.minDaysOverdue !== undefined) {
                daysOverdueFilter.$gte = filters.minDaysOverdue;
            }
            if (filters.maxDaysOverdue !== undefined) {
                daysOverdueFilter.$lte = filters.maxDaysOverdue;
            }
            if (Object.keys(daysOverdueFilter).length > 0) {
                pipeline.push({ $match: { daysOverdue: daysOverdueFilter } });
            }
            // Остальные фильтры
            const additionalMatch = {};
            if (filters.isOverdue !== undefined) {
                if (filters.isOverdue) {
                    additionalMatch.dueDate = { $lt: currentDate };
                    additionalMatch.status = { $ne: 'PAID' };
                }
                else {
                    additionalMatch.$or = [
                        { dueDate: { $gte: currentDate } },
                        { status: 'PAID' },
                    ];
                }
            }
            if (filters.minAmount !== undefined) {
                additionalMatch.outstandingAmount = additionalMatch.outstandingAmount || {};
                additionalMatch.outstandingAmount.$gte = filters.minAmount;
            }
            if (filters.maxAmount !== undefined) {
                additionalMatch.outstandingAmount = additionalMatch.outstandingAmount || {};
                additionalMatch.outstandingAmount.$lte = filters.maxAmount;
            }
            if (filters.dueDateFrom || filters.dueDateTo) {
                additionalMatch.dueDate = additionalMatch.dueDate || {};
                if (filters.dueDateFrom) {
                    additionalMatch.dueDate.$gte = filters.dueDateFrom;
                }
                if (filters.dueDateTo) {
                    additionalMatch.dueDate.$lte = filters.dueDateTo;
                }
            }
            if (Object.keys(additionalMatch).length > 0) {
                pipeline.push({ $match: additionalMatch });
            }
            // Подсчет total
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await invoice_schema_1.InvoiceModel.aggregate(countPipeline).exec();
            const total = countResult.length > 0 ? countResult[0].total : 0;
            // Сортировка
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
            pipeline.push({ $sort: sortOptions });
            // Пагинация
            pipeline.push({ $skip: offset }, { $limit: limit });
            // Подтягиваем данные о клиенте
            pipeline.push({
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerData',
                },
            });
            const docs = await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec();
            // Преобразуем результаты в Invoice entities
            const invoices = docs.map((doc) => this.mapToDomain(doc));
            return {
                invoices,
                total,
                limit,
                offset,
            };
        }
        catch (error) {
            console.error('Error finding invoices with days overdue filter:', error);
            throw new AppError_1.AppError('Ошибка при получении списка счетов', 500);
        }
    }
    /**
     * Получает список счетов с фильтрацией и пагинацией
     * @param options - Опции фильтрации, сортировки и пагинации
     * @returns Список счетов и общее количество
     */
    async findAll(options) {
        try {
            const { filters = {}, limit = 50, offset = 0, sortBy = 'dueDate', sortOrder = 'asc', } = options;
            // Строим фильтр для MongoDB
            const query = {};
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
                    query.customerId = new mongoose_1.Types.ObjectId(filters.customerId);
                }
            }
            if (filters.isOverdue !== undefined) {
                if (filters.isOverdue) {
                    query.dueDate = { $lt: new Date() };
                    query.status = { $ne: 'PAID' };
                }
                else {
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
            // Фильтр по дням просрочки (используем aggregation для точного расчета)
            if (filters.minDaysOverdue !== undefined || filters.maxDaysOverdue !== undefined) {
                // Для фильтрации по дням просрочки нужно использовать aggregation
                return await this.findAllWithDaysOverdueFilter(options);
            }
            // Сортировка
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
            // Выполняем запросы параллельно
            const [docs, total] = await Promise.all([
                invoice_schema_1.InvoiceModel.find(query)
                    .sort(sortOptions)
                    .skip(offset)
                    .limit(limit)
                    .populate('customerId', 'name unp contactInfo')
                    .lean() // Используем lean() для получения простых объектов
                    .exec(),
                invoice_schema_1.InvoiceModel.countDocuments(query).exec(),
            ]);
            // Логирование для отладки populate
            if (docs.length > 0) {
                const firstDoc = docs[0];
                console.log('=== POPULATE DEBUG ===');
                console.log('customerId type:', typeof firstDoc.customerId);
                console.log('customerId value:', firstDoc.customerId);
                console.log('Is object:', typeof firstDoc.customerId === 'object');
                console.log('Has name:', firstDoc.customerId?.name);
                console.log('Full customerId:', JSON.stringify(firstDoc.customerId, null, 2));
                console.log('====================');
            }
            const invoices = docs.map((doc) => this.mapToDomain(doc));
            return {
                invoices,
                total,
                limit,
                offset,
            };
        }
        catch (error) {
            console.error('Error finding invoices:', error);
            throw new AppError_1.AppError('Ошибка при получении списка счетов', 500);
        }
    }
    /**
     * Обновляет информацию об оплате для счета
     * @param id - ID счета
     * @param paidAmount - Новая сумма оплаты
     * @param actualPaymentDate - Дата фактической оплаты
     * @returns Обновленный счет или null
     */
    async updatePayment(id, paidAmount, actualPaymentDate) {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        try {
            const doc = await invoice_schema_1.InvoiceModel.findById(id).exec();
            if (!doc)
                return null;
            const oldPaidAmount = doc.paidAmount;
            const paymentDifference = paidAmount - oldPaidAmount;
            // Если сумма оплаты увеличилась, создаем запись в истории платежей
            if (paymentDifference > 0 && actualPaymentDate) {
                const { PaymentHistoryModel } = await Promise.resolve().then(() => __importStar(require('../schemas/payment-history.schema')));
                // Определяем, был ли платеж в срок
                const isOnTime = actualPaymentDate <= doc.dueDate;
                // Вычисляем задержку в днях (если просрочен)
                let daysDelay = 0;
                if (!isOnTime) {
                    const diffTime = actualPaymentDate.getTime() - doc.dueDate.getTime();
                    daysDelay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                // Создаем запись в истории платежей
                await PaymentHistoryModel.create({
                    invoiceId: doc._id,
                    amount: paymentDifference, // Сохраняем только разницу (новый платеж)
                    paymentDate: actualPaymentDate,
                    isOnTime: isOnTime,
                    daysDelay: daysDelay,
                });
            }
            // Обновляем суммы и даты
            doc.paidAmount = paidAmount;
            if (actualPaymentDate) {
                doc.actualPaymentDate = actualPaymentDate;
            }
            // Обновляем статус
            if (paidAmount >= doc.totalAmount) {
                doc.status = 'PAID';
                doc.debtWorkStatus = 'CLOSED';
            }
            else if (doc.dueDate < new Date()) {
                doc.status = 'OVERDUE';
            }
            else {
                doc.status = 'OPEN';
            }
            const updatedDoc = await doc.save();
            return this.mapToDomain(updatedDoc);
        }
        catch (error) {
            console.error(`Error updating payment for invoice ${id}:`, error);
            throw new AppError_1.AppError('Ошибка при обновлении оплаты счета', 500);
        }
    }
    /**
     * Получает топ-N должников с наибольшей задолженностью
     * @param limit - Количество должников в топе
     * @param asOfDate - Дата расчета
     * @returns Массив топ должников
     */
    async getTopDebtors(limit, asOfDate = new Date()) {
        try {
            const pipeline = [
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
                        customerUnp: '$customer.unp',
                        totalDebt: { $round: ['$totalDebt', 2] },
                        overdueDebt: { $round: ['$overdueDebt', 2] },
                        invoiceCount: 1,
                        oldestDebtDays: 1,
                    },
                },
            ];
            const result = await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec();
            return result;
        }
        catch (error) {
            console.error('Error getting top debtors:', error);
            throw new AppError_1.AppError('Ошибка при получении топ должников', 500);
        }
    }
    /**
     * Получает всех контрагентов с задолженностью для ABC-анализа.
     * Аналогично getTopDebtors, но без ограничения по количеству.
     */
    async getAllCustomersWithDebt(asOfDate = new Date()) {
        try {
            const pipeline = [
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
                        customerUnp: '$customer.unp',
                        totalDebt: { $round: ['$totalDebt', 2] },
                        overdueDebt: { $round: ['$overdueDebt', 2] },
                        invoiceCount: 1,
                        oldestDebtDays: 1,
                    },
                },
            ];
            const result = await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec();
            return result;
        }
        catch (error) {
            console.error('Error getting all customers with debt:', error);
            throw new AppError_1.AppError('Ошибка при получении контрагентов с задолженностью', 500);
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
    /**
     * Получает список клиентов с просрочкой и фильтрацией по aging buckets
     * @param options - Опции фильтрации, сортировки и пагинации
     * @param asOfDate - Дата расчета
     * @returns Список клиентов с информацией о просрочке
     */
    async getCustomersWithOverdue(options, asOfDate = new Date()) {
        try {
            const { filters = {}, limit = 50, offset = 0, sortBy = 'overdueAmount', sortOrder = 'desc', } = options;
            const pipeline = [
                // Берем только неоплаченные счета
                { $match: { status: { $ne: 'PAID' } } },
                // Вычисляем остаток задолженности и дни просрочки
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
                // Определяем aging bucket для каждого счета
                {
                    $addFields: {
                        agingBucket: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ['$daysOverdue', 0] },
                                        then: 'CURRENT',
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $gte: ['$daysOverdue', 1] },
                                                { $lte: ['$daysOverdue', 30] },
                                            ],
                                        },
                                        then: '1_30',
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $gte: ['$daysOverdue', 31] },
                                                { $lte: ['$daysOverdue', 60] },
                                            ],
                                        },
                                        then: '31_60',
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $gte: ['$daysOverdue', 61] },
                                                { $lte: ['$daysOverdue', 90] },
                                            ],
                                        },
                                        then: '61_90',
                                    },
                                    {
                                        case: { $gte: ['$daysOverdue', 91] },
                                        then: '91_PLUS',
                                    },
                                ],
                                default: 'CURRENT',
                            },
                        },
                    },
                },
            ];
            // Применяем фильтры
            const matchFilters = {};
            // Фильтр по минимальным дням просрочки
            if (filters.minDaysOverdue !== undefined) {
                matchFilters.daysOverdue = matchFilters.daysOverdue || {};
                matchFilters.daysOverdue.$gte = filters.minDaysOverdue;
            }
            // Фильтр по максимальным дням просрочки
            if (filters.maxDaysOverdue !== undefined) {
                matchFilters.daysOverdue = matchFilters.daysOverdue || {};
                matchFilters.daysOverdue.$lte = filters.maxDaysOverdue;
            }
            // Исключаем CURRENT на уровне счетов, если не указано includeCurrent И не запрашивается CURRENT bucket
            // Если явно запрашивается CURRENT bucket, автоматически включаем его
            // Примечание: фильтр по agingBucket для клиентов будет применен ПОСЛЕ группировки
            if (!filters.includeCurrent && filters.agingBucket !== customers_overdue_filters_dto_1.AgingBucket.CURRENT) {
                matchFilters.daysOverdue = matchFilters.daysOverdue || {};
                matchFilters.daysOverdue.$gt = 0;
            }
            if (Object.keys(matchFilters).length > 0) {
                pipeline.push({ $match: matchFilters });
            }
            // Группируем по клиенту
            pipeline.push({
                $group: {
                    _id: '$customerId',
                    totalDebt: { $sum: '$outstandingAmount' },
                    overdueDebt: {
                        $sum: {
                            $cond: ['$isOverdue', '$outstandingAmount', 0],
                        },
                    },
                    currentDebt: {
                        $sum: {
                            $cond: [
                                { $not: ['$isOverdue'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                    invoiceCount: { $sum: 1 },
                    overdueInvoiceCount: {
                        $sum: { $cond: ['$isOverdue', 1, 0] },
                    },
                    oldestDebtDays: { $max: '$daysOverdue' },
                    // Разбивка по aging buckets
                    current: {
                        $sum: {
                            $cond: [
                                { $eq: ['$agingBucket', 'CURRENT'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                    days_1_30: {
                        $sum: {
                            $cond: [
                                { $eq: ['$agingBucket', '1_30'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                    days_31_60: {
                        $sum: {
                            $cond: [
                                { $eq: ['$agingBucket', '31_60'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                    days_61_90: {
                        $sum: {
                            $cond: [
                                { $eq: ['$agingBucket', '61_90'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                    days_91_plus: {
                        $sum: {
                            $cond: [
                                { $eq: ['$agingBucket', '91_PLUS'] },
                                '$outstandingAmount',
                                0,
                            ],
                        },
                    },
                },
            });
            // Фильтр по минимальной сумме просроченной задолженности
            if (filters.minOverdueAmount !== undefined) {
                pipeline.push({
                    $match: { overdueDebt: { $gte: filters.minOverdueAmount } },
                });
            }
            // Определяем aging bucket клиента по самой старой просрочке
            pipeline.push({
                $addFields: {
                    agingBucket: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ['$oldestDebtDays', 0] },
                                    then: 'CURRENT',
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$oldestDebtDays', 1] },
                                            { $lte: ['$oldestDebtDays', 30] },
                                        ],
                                    },
                                    then: '1_30',
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$oldestDebtDays', 31] },
                                            { $lte: ['$oldestDebtDays', 60] },
                                        ],
                                    },
                                    then: '31_60',
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$oldestDebtDays', 61] },
                                            { $lte: ['$oldestDebtDays', 90] },
                                        ],
                                    },
                                    then: '61_90',
                                },
                                {
                                    case: { $gte: ['$oldestDebtDays', 91] },
                                    then: '91_PLUS',
                                },
                            ],
                            default: 'CURRENT',
                        },
                    },
                },
            });
            // Фильтр по aging bucket для клиентов (применяется ПОСЛЕ вычисления agingBucket клиента)
            // Если не указаны minDaysOverdue/maxDaysOverdue
            if (filters.agingBucket &&
                !filters.minDaysOverdue &&
                !filters.maxDaysOverdue) {
                pipeline.push({
                    $match: { agingBucket: filters.agingBucket },
                });
            }
            // Подтягиваем данные о клиенте
            pipeline.push({
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer',
                },
            }, {
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true,
                },
            });
            // Сохраняем результаты для подсчета total
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await invoice_schema_1.InvoiceModel.aggregate(countPipeline).exec();
            const total = countResult.length > 0 ? countResult[0].total : 0;
            // Определяем поле для сортировки
            let sortField = 'overdueDebt';
            if (sortBy === 'totalDebt')
                sortField = 'totalDebt';
            else if (sortBy === 'oldestDebtDays')
                sortField = 'oldestDebtDays';
            else if (sortBy === 'customerName')
                sortField = 'customer.name';
            // Сортировка
            pipeline.push({
                $sort: { [sortField]: sortOrder === 'asc' ? 1 : -1 },
            });
            // Пагинация
            pipeline.push({ $skip: offset }, { $limit: limit });
            // Формируем финальный объект
            pipeline.push({
                $project: {
                    _id: 0,
                    customerId: { $toString: '$_id' },
                    customerName: {
                        $ifNull: ['$customer.name', 'Unknown Customer'],
                    },
                    customerUnp: '$customer.unp',
                    totalDebt: { $round: ['$totalDebt', 2] },
                    overdueDebt: { $round: ['$overdueDebt', 2] },
                    currentDebt: { $round: ['$currentDebt', 2] },
                    invoiceCount: 1,
                    overdueInvoiceCount: 1,
                    oldestDebtDays: 1,
                    agingBucket: 1,
                    agingBreakdown: {
                        current: { $round: ['$current', 2] },
                        days_1_30: { $round: ['$days_1_30', 2] },
                        days_31_60: { $round: ['$days_31_60', 2] },
                        days_61_90: { $round: ['$days_61_90', 2] },
                        days_91_plus: { $round: ['$days_91_plus', 2] },
                    },
                },
            });
            const customers = (await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec());
            // Вычисляем summary
            const summaryPipeline = [
                { $match: { status: { $ne: 'PAID' } } },
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
                { $match: { outstandingAmount: { $gt: 0 }, isOverdue: true } },
                {
                    $group: {
                        _id: null,
                        totalOverdueAmount: { $sum: '$outstandingAmount' },
                        totalDaysOverdue: { $sum: '$daysOverdue' },
                        count: { $sum: 1 },
                        uniqueCustomers: { $addToSet: '$customerId' },
                    },
                },
            ];
            const summaryResult = await invoice_schema_1.InvoiceModel.aggregate(summaryPipeline).exec();
            const summary = summaryResult.length > 0
                ? {
                    totalOverdueAmount: Math.round(summaryResult[0].totalOverdueAmount * 100) / 100,
                    totalCustomers: summaryResult[0].uniqueCustomers.length,
                    averageDaysOverdue: Math.round((summaryResult[0].totalDaysOverdue /
                        summaryResult[0].count) *
                        100) / 100,
                }
                : {
                    totalOverdueAmount: 0,
                    totalCustomers: 0,
                    averageDaysOverdue: 0,
                };
            return {
                customers,
                total,
                limit,
                offset,
                summary,
            };
        }
        catch (error) {
            console.error('Error getting customers with overdue:', error);
            throw new AppError_1.AppError('Ошибка при получении клиентов с просрочкой', 500);
        }
    }
    /**
     * Получает все счета с задолженностью для анализа по договорам
     * @param asOfDate - Дата расчета (используется для расчета просрочки в use case)
     * @param customerId - Фильтр по контрагенту (опционально)
     * @param contractNumber - Фильтр по номеру договора (опционально)
     * @returns Массив счетов с информацией о клиентах
     */
    async getInvoicesByContract(_asOfDate = new Date(), customerId, contractNumber) {
        try {
            const matchStage = {
                status: { $ne: 'PAID' }, // Только неоплаченные счета
            };
            // Фильтр по контрагенту
            if (customerId) {
                if (customerId.match(/^[0-9a-fA-F]{24}$/)) {
                    matchStage.customerId = new mongoose_1.Types.ObjectId(customerId);
                }
            }
            // Фильтр по номеру договора
            if (contractNumber) {
                matchStage.contractNumber = contractNumber;
            }
            const pipeline = [
                { $match: matchStage },
                // Вычисляем остаток задолженности
                {
                    $addFields: {
                        outstandingAmount: {
                            $subtract: ['$totalAmount', '$paidAmount'],
                        },
                    },
                },
                // Фильтруем только те, у кого есть задолженность
                { $match: { outstandingAmount: { $gt: 0 } } },
                // Подтягиваем данные о клиенте
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customerData',
                    },
                },
                // Разворачиваем массив customer
                {
                    $unwind: {
                        path: '$customerData',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // Сортируем по номеру договора и дате выставления
                {
                    $sort: {
                        contractNumber: 1,
                        issueDate: -1,
                    },
                },
            ];
            const docs = await invoice_schema_1.InvoiceModel.aggregate(pipeline).exec();
            // Преобразуем в доменные сущности
            const invoices = docs.map((doc) => {
                const invoice = this.mapToDomain(doc);
                // Добавляем информацию о клиенте, если есть
                if (doc.customerData) {
                    invoice.customer = new customer_entity_1.Customer({
                        id: doc.customerData._id.toString(),
                        name: doc.customerData.name,
                        unp: doc.customerData.unp,
                        contactInfo: doc.customerData.contactInfo,
                        createdAt: doc.customerData.createdAt,
                        updatedAt: doc.customerData.updatedAt,
                    });
                }
                return invoice;
            });
            return invoices;
        }
        catch (error) {
            console.error('Error getting invoices by contract:', error);
            throw new AppError_1.AppError('Ошибка при получении счетов по договорам', 500);
        }
    }
};
exports.MongoInvoiceRepository = MongoInvoiceRepository;
exports.MongoInvoiceRepository = MongoInvoiceRepository = __decorate([
    (0, tsyringe_1.injectable)()
], MongoInvoiceRepository);
//# sourceMappingURL=invoice.repository.js.map