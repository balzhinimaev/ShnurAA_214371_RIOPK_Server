"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = void 0;
// src/infrastructure/database/mongoose/schemas/invoice.schema.ts
const mongoose_1 = require("mongoose");
// 3. Расширенная схема с новыми полями
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, index: true },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true,
    },
    // Базовые даты
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    // Период оказания услуги
    serviceStartDate: { type: Date },
    serviceEndDate: { type: Date },
    // Суммы
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    // Даты и сроки
    paymentTermDays: { type: Number, required: true, default: 30 },
    actualPaymentDate: { type: Date },
    // Статусы
    status: {
        type: String,
        enum: ['OPEN', 'PAID', 'OVERDUE'],
        required: true,
        index: true,
    },
    debtWorkStatus: {
        type: String,
        enum: [
            'IN_TIME',
            'CALL',
            'CLAIM',
            'PRE_TRIAL',
            'TRIAL',
            'COLLECTION',
            'WRITE_OFF',
            'CLOSED',
        ],
        index: true,
    },
    // Специфика бизнеса
    serviceType: {
        type: String,
        enum: [
            'PKT_SUPPORT',
            'KKT_INSTALLATION',
            'KKT_SERVICE',
            'VENDING_SERVICE',
            'VENDING_INSTALLATION',
            'OTHER',
        ],
        index: true,
    },
    manager: { type: String, index: true },
    // История работы с долгом
    lastContactDate: { type: Date },
    contactResult: { type: String },
    notes: { type: String },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            if (ret.customerId) {
                ret.customerId = ret.customerId.toString();
            }
            delete ret._id;
            if (ret.__v !== undefined)
                delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            if (ret.customerId) {
                ret.customerId = ret.customerId.toString();
            }
            delete ret._id;
            if (ret.__v !== undefined)
                delete ret.__v;
            return ret;
        },
    },
});
// Составной индекс для быстрого поиска по клиенту и номеру счета
InvoiceSchema.index({ customerId: 1, invoiceNumber: 1 }, { unique: true });
// Индекс для поиска по менеджеру и статусу долга
InvoiceSchema.index({ manager: 1, debtWorkStatus: 1 });
exports.InvoiceModel = (0, mongoose_1.model)('Invoice', InvoiceSchema);
//# sourceMappingURL=invoice.schema.js.map