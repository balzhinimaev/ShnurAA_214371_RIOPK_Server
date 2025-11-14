// src/infrastructure/database/mongoose/schemas/debt-work-record.schema.ts
import { Schema, model, Document, Types } from 'mongoose';
import { DebtWorkRecord } from '../../../../domain/entities/debt-work-record.entity';
import { DebtWorkActionType } from '../../../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../../../domain/enums/debt-work-result.enum';

export interface IDebtWorkRecordDocument extends Omit<DebtWorkRecord, 'id' | 'customerId' | 'invoiceId' | 'performedBy'>, Document {
    customerId: Types.ObjectId;
    invoiceId?: Types.ObjectId;
    performedBy: Types.ObjectId;
}

const DebtWorkRecordSchema = new Schema<IDebtWorkRecordDocument>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Invoice',
        },
        actionType: {
            type: String,
            enum: Object.values(DebtWorkActionType),
            required: true,
            index: true,
        },
        actionDate: {
            type: Date,
            required: true,
            index: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        result: {
            type: String,
            enum: Object.values(DebtWorkResult),
            required: true,
        },
        description: {
            type: String,
        },
        nextActionDate: {
            type: Date,
        },
        amount: {
            type: Number,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.customerId) ret.customerId = (ret.customerId as Types.ObjectId).toString();
                if (ret.invoiceId) ret.invoiceId = (ret.invoiceId as Types.ObjectId).toString();
                if (ret.performedBy) ret.performedBy = (ret.performedBy as Types.ObjectId).toString();
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: any) => {
                ret.id = (ret._id as Types.ObjectId).toString();
                if (ret.customerId) ret.customerId = (ret.customerId as Types.ObjectId).toString();
                if (ret.invoiceId) ret.invoiceId = (ret.invoiceId as Types.ObjectId).toString();
                if (ret.performedBy) ret.performedBy = (ret.performedBy as Types.ObjectId).toString();
                delete ret._id;
                if (ret.__v !== undefined) delete ret.__v;
                return ret;
            },
        },
    },
);

// Индексы для оптимизации запросов
DebtWorkRecordSchema.index({ customerId: 1, actionDate: -1 });
DebtWorkRecordSchema.index({ invoiceId: 1 });
DebtWorkRecordSchema.index({ performedBy: 1 });
DebtWorkRecordSchema.index({ nextActionDate: 1 }); // Для поиска запланированных действий

export const DebtWorkRecordModel = model<IDebtWorkRecordDocument>(
    'DebtWorkRecord',
    DebtWorkRecordSchema,
);

