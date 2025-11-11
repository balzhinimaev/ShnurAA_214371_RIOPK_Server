"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = void 0;
// src/infrastructure/database/mongoose/schemas/invoice.schema.ts
const mongoose_1 = require("mongoose");
// 3. Схема остается почти такой же, но теперь она соответствует IInvoiceDocument
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, index: true },
    // Тип в схеме остается ObjectId
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true,
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['OPEN', 'PAID', 'OVERDUE'],
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            // Преобразуем customerId в строку при выводе JSON
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
            // Преобразуем customerId в строку при выводе JS объекта (для маппинга в Domain Entity)
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
exports.InvoiceModel = (0, mongoose_1.model)('Invoice', InvoiceSchema);
//# sourceMappingURL=invoice.schema.js.map