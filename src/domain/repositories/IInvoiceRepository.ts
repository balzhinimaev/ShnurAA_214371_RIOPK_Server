// src/domain/repositories/IInvoiceRepository.ts
import { Invoice } from '../entities/invoice.entity';

export interface AgingBucket {
    bucket: string;
    amount: number;
    count: number;
}

export interface DashboardSummaryData {
    totalReceivables: number;
    overdueReceivables: number;
    overduePercentage: number;
    currentReceivables: number;
    averagePaymentDelayDays: number;
    totalInvoicesCount: number;
    overdueInvoicesCount: number;
    agingStructure: AgingBucket[];
    // Новые показатели согласно требованиям
    averageReceivables: number; // Средняя ДЗ за период
    turnoverRatio: number; // Оборачиваемость ДЗ
    periodRevenue: number; // Выручка за период (для расчета оборачиваемости)
    // Показатели на основе истории платежей
    averagePaymentDays: number; // Средний срок оплаты (от выставления до оплаты)
    onTimePaymentsAmount: number; // Сумма платежей в срок
    overduePaymentsPercentage: number; // Процент просроченных платежей
}

export interface IInvoiceRepository {
    findById(id: string): Promise<Invoice | null>;
    // findAll(options?: { ... }): Promise<{ items: Invoice[]; total: number }>;
    // create(data: CreateInvoiceProps): Promise<Invoice>;
    // updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null>;

    getDashboardSummary(currentDate?: Date): Promise<DashboardSummaryData>;
    getAgingReport(buckets: number[], asOfDate?: Date): Promise<AgingBucket[]>;
    getReceivablesDynamics(
        startDate: Date,
        endDate: Date,
    ): Promise<
        {
            period: string;
            totalDebt: number;
            overdueDebt: number;
        }[]
    >;

    getReceivablesStructure(asOfDate: Date): Promise<{
        byAgingBucket: { bucket: string; amount: number; count: number; percentage: number }[];
        byServiceType: { serviceType: string; amount: number; count: number; percentage: number }[];
        byManager: { manager: string; amount: number; count: number; percentage: number }[];
    }>;
}
export const InvoiceRepositoryToken = Symbol('IInvoiceRepository');
