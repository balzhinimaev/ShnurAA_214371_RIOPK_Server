// src/domain/repositories/IDebtWorkRecordRepository.ts
import { DebtWorkRecord, CustomerDebtWorkStats } from '../entities/debt-work-record.entity';

export interface CreateDebtWorkRecordData {
    customerId: string;
    invoiceId?: string;
    actionType: string;
    actionDate: Date;
    performedBy: string;
    result: string;
    description?: string;
    nextActionDate?: Date;
    amount?: number;
}

export interface FindDebtWorkRecordsOptions {
    customerId: string;
    invoiceId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'actionDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface IDebtWorkRecordRepository {
    create(data: CreateDebtWorkRecordData): Promise<DebtWorkRecord>;
    findById(id: string): Promise<DebtWorkRecord | null>;
    findByCustomerId(customerId: string, options?: FindDebtWorkRecordsOptions): Promise<{ records: DebtWorkRecord[]; total: number }>;
    getCustomerStats(customerId: string): Promise<CustomerDebtWorkStats>;
    update(id: string, data: Partial<CreateDebtWorkRecordData>): Promise<DebtWorkRecord | null>;
    delete(id: string): Promise<boolean>;
}

export const DebtWorkRecordRepositoryToken = Symbol('IDebtWorkRecordRepository');

