// src/infrastructure/database/mongoose/schemas/user.schema.ts
import { Schema, model, Document } from 'mongoose';
import { User } from '../../../../domain/entities/user.entity';

// Интерфейс для документа Mongoose, расширяющий наш User entity
// Это необходимо, т.к. Mongoose документ имеет доп. методы и свойства
export interface IUserDocument extends Omit<User, 'id'>, Document {}

export const UserSchema = new Schema<IUserDocument>(
    {
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
    },
    {
        timestamps: true, // Автоматически добавляет createdAt и updatedAt
        // Преобразование документа Mongoose в нашу сущность User при выводе
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString(); // Преобразуем _id в id (строка)
                delete ret._id; // Удаляем _id
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
                delete ret.__v;
                return ret;
            },
        },
    },
);

// Индекс для ускорения поиска по email
// UserSchema.index({ email: 1 });

export const UserModel = model<IUserDocument>('User', UserSchema);
