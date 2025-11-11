// src/infrastructure/database/mongoose/schemas/customer.schema.ts
import { Schema, model, Document, Types } from 'mongoose';
import { Customer } from '../../../../domain/entities/customer.entity';

// Исключаем расчетные поля из документа
export interface ICustomerDocument
    extends Omit<Customer, 'id' | 'totalDebt' | 'overdueDebt'>,
        Document {
    userId: Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomerDocument>(
    {
        name: { type: String, required: true, index: true },
        unp: { type: String, sparse: true, unique: true }, // Уникальный, но может отсутствовать
        contactInfo: { type: String },
                userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.userId) ret.userId = (ret.userId as Types.ObjectId).toString();
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.userId) ret.userId = (ret.userId as Types.ObjectId).toString();
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
    },
);

// Добавляем составной уникальный индекс для УНП в рамках одного пользователя (если УНП есть)
CustomerSchema.index({ userId: 1, unp: 1 }, { unique: true, sparse: true });

export const CustomerModel = model<ICustomerDocument>(
    'Customer',
    CustomerSchema,
);
