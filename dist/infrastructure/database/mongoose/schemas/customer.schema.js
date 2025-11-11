"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
// src/infrastructure/database/mongoose/schemas/customer.schema.ts
const mongoose_1 = require("mongoose");
const CustomerSchema = new mongoose_1.Schema({
    name: { type: String, required: true, index: true },
    inn: { type: String, sparse: true, unique: true }, // Уникальный, но может отсутствовать
    contactInfo: { type: String },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            if (ret.userId)
                ret.userId = ret.userId.toString();
            delete ret._id;
            if (ret.__v !== undefined)
                delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            if (ret.userId)
                ret.userId = ret.userId.toString();
            delete ret._id;
            if (ret.__v !== undefined)
                delete ret.__v;
            return ret;
        },
    },
});
// Добавляем составной уникальный индекс для ИНН в рамках одного пользователя (если ИНН есть)
CustomerSchema.index({ userId: 1, inn: 1 }, { unique: true, sparse: true });
exports.CustomerModel = (0, mongoose_1.model)('Customer', CustomerSchema);
//# sourceMappingURL=customer.schema.js.map