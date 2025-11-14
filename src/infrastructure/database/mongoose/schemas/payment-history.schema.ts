// src/infrastructure/database/mongoose/schemas/payment-history.schema.ts
import { Schema, model, Document, Types } from 'mongoose';

// Интерфейс для документа истории платежа
export interface IPaymentHistoryDocument extends Document {
    invoiceId: Types.ObjectId; // Ссылка на счет
    amount: number; // Сумма платежа
    paymentDate: Date; // Дата платежа
    isOnTime: boolean; // Был ли платеж в срок (paymentDate <= dueDate)
    daysDelay?: number; // Количество дней задержки (если просрочен, иначе 0)
    createdAt: Date; // Когда запись была создана
    updatedAt: Date;
}

// Схема истории платежей
export const PaymentHistorySchema = new Schema<IPaymentHistoryDocument>(
    {
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentDate: {
            type: Date,
            required: true,
            index: true,
        },
        isOnTime: {
            type: Boolean,
            required: true,
            index: true,
        },
        daysDelay: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.invoiceId) {
                    ret.invoiceId = (ret.invoiceId as Types.ObjectId).toString();
                }
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.invoiceId) {
                    ret.invoiceId = (ret.invoiceId as Types.ObjectId).toString();
                }
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
    },
);

// Индексы для быстрого поиска
PaymentHistorySchema.index({ invoiceId: 1, paymentDate: 1 });
PaymentHistorySchema.index({ paymentDate: 1, isOnTime: 1 });

export const PaymentHistoryModel = model<IPaymentHistoryDocument>(
    'PaymentHistory',
    PaymentHistorySchema,
);

