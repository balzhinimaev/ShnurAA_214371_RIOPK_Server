// src/infrastructure/database/mongoose/schemas/invoice.schema.ts
import { Schema, model, Document, Types } from 'mongoose';
import {
    Invoice,
    DebtWorkStatus,
    ServiceType,
} from '../../../../domain/entities/invoice.entity';

// 1. Определяем базовый тип для документа Mongoose, ИСКЛЮЧАЯ расчетные поля и методы
type InvoiceDocumentProps = Omit<
    Invoice,
    | 'id'
    | 'customer'
    | 'outstandingAmount'
    | 'isOverdue'
    | 'getDaysOverdue'
    | 'calculateDebtWorkStatus'
    | 'applyPayment'
    | 'customerId'
>;

// 2. Создаем интерфейс документа Mongoose с правильным типом customerId
export interface IInvoiceDocument extends InvoiceDocumentProps, Document {
    customerId: Types.ObjectId; // ObjectId для ссылки на Customer
}

// 3. Расширенная схема с новыми полями
export const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        invoiceNumber: { type: String, required: true, index: true },
        customerId: {
            type: Schema.Types.ObjectId,
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
            ] as DebtWorkStatus[],
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
            ] as ServiceType[],
            index: true,
        },
        manager: { type: String, index: true },
        contractNumber: { type: String, index: true }, // Номер договора
        
        // История работы с долгом
        lastContactDate: { type: Date },
        contactResult: { type: String },
        notes: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
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

// Составной индекс для быстрого поиска по клиенту и номеру счета
InvoiceSchema.index({ customerId: 1, invoiceNumber: 1 }, { unique: true });

// Индекс для поиска по менеджеру и статусу долга
InvoiceSchema.index({ manager: 1, debtWorkStatus: 1 });

export const InvoiceModel = model<IInvoiceDocument>('Invoice', InvoiceSchema);
