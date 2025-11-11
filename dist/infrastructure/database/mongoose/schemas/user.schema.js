"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.UserSchema = void 0;
// src/infrastructure/database/mongoose/schemas/user.schema.ts
const mongoose_1 = require("mongoose");
exports.UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: { type: String, required: true },
    roles: {
        type: [String], // Массив строк
        enum: ['ADMIN', 'ANALYST', 'MANAGER'], // Допустимые значения
        default: ['ANALYST'], // Роль по умолчанию
        required: true,
    },
}, {
    timestamps: true, // Автоматически добавляет createdAt и updatedAt
    // Преобразование документа Mongoose в нашу сущность User при выводе
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = ret._id.toString(); // Преобразуем _id в id (строка)
            delete ret._id; // Удаляем _id
            if (ret.__v !== undefined)
                delete ret.__v; // Удаляем версию документа
            // delete ret.passwordHash; // Можно удалять хеш при выводе, если не нужен вовне
            return ret;
        },
    },
    toObject: {
        // Аналогично для toObject
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            if (ret.__v !== undefined)
                delete ret.__v;
            return ret;
        },
    },
});
// Индекс для ускорения поиска по email
// UserSchema.index({ email: 1 });
exports.UserModel = (0, mongoose_1.model)('User', exports.UserSchema);
//# sourceMappingURL=user.schema.js.map