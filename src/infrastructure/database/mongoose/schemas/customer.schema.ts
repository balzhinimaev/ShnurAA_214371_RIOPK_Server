// src/infrastructure/database/mongoose/schemas/customer.schema.ts
import { Schema, model, Document } from 'mongoose';
import { Customer } from '../../../../domain/entities/customer.entity';

// Исключаем расчетные поля из документа
export interface ICustomerDocument
    extends Omit<Customer, 'id' | 'totalDebt' | 'overdueDebt'>,
        Document {}

const CustomerSchema = new Schema<ICustomerDocument>(
    {
        name: { type: String, required: true, index: true },
        inn: { type: String, sparse: true, unique: true }, // Уникальный, но может отсутствовать
        contactInfo: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    },
);

export const CustomerModel = model<ICustomerDocument>(
    'Customer',
    CustomerSchema,
);
