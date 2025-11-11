// src/infrastructure/database/mongoose/schemas/invoice.schema.ts
import { Schema, model, Document, Types } from 'mongoose';
import {
    Invoice,
    // InvoiceStatus,
} from '../../../../domain/entities/invoice.entity';

// 1. Определяем базовый тип для документа Mongoose, ИСКЛЮЧАЯ несовместимое поле customerId
type InvoiceDocumentProps = Omit<
    Invoice,
    'id' | 'customer' | 'outstandingAmount' | 'isOverdue' | 'customerId' | 'userId'
>;

// 2. Создаем интерфейс документа Mongoose, расширяя базовый тип и ДОБАВЛЯЯ customerId с правильным типом ObjectId
export interface IInvoiceDocument extends InvoiceDocumentProps, Document {
    customerId: Types.ObjectId; // Явно указываем тип ObjectId для ссылки в документе
}

// 3. Схема остается почти такой же, но теперь она соответствует IInvoiceDocument
const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        invoiceNumber: { type: String, required: true, index: true },
        // Тип в схеме остается ObjectId
        customerId: {
            type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                // Преобразуем customerId в строку при выводе JSON
                if (ret.customerId) {
                    ret.customerId = (ret.customerId as Types.ObjectId).toString();
                }
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                // Преобразуем customerId в строку при выводе JS объекта (для маппинга в Domain Entity)
                if (ret.customerId) {
                    ret.customerId = (ret.customerId as Types.ObjectId).toString();
                }
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
    },
);

export const InvoiceModel = model<IInvoiceDocument>('Invoice', InvoiceSchema);
