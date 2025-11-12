// src/application/dtos/reports/contract-analysis.dto.ts
import { Expose, Type } from 'class-transformer';

/**
 * DTO для счета в анализе по договорам
 */
export class ContractAnalysisInvoiceDto {
    @Expose()
    invoiceId!: string;

    @Expose()
    invoiceNumber!: string;

    @Expose()
    issueDate!: Date;

    @Expose()
    dueDate!: Date;

    @Expose()
    totalAmount!: number;

    @Expose()
    paidAmount!: number;

    @Expose()
    outstandingAmount!: number;

    @Expose()
    overdueAmount!: number;

    @Expose()
    daysOverdue!: number;

    @Expose()
    status!: string;

    @Expose()
    debtWorkStatus?: string;
}

/**
 * DTO для договора в анализе
 */
export class ContractAnalysisContractDto {
    @Expose()
    contractNumber!: string;

    @Expose()
    customerId!: string;

    @Expose()
    customerName!: string;

    @Expose()
    customerUnp?: string;

    @Expose()
    serviceType?: string;

    @Expose()
    manager?: string;

    @Expose()
    totalDebt!: number;

    @Expose()
    overdueDebt!: number;

    @Expose()
    currentDebt!: number;

    @Expose()
    invoiceCount!: number;

    @Expose()
    overdueInvoiceCount!: number;

    @Expose()
    oldestDebtDays!: number;

    @Expose()
    @Type(() => ContractAnalysisInvoiceDto)
    invoices!: ContractAnalysisInvoiceDto[];
}

/**
 * DTO для результата анализа по договорам
 */
export class ContractAnalysisDto {
    @Expose()
    @Type(() => ContractAnalysisContractDto)
    contracts!: ContractAnalysisContractDto[];

    @Expose()
    summary!: {
        totalContracts: number; // Общее количество договоров с задолженностью
        totalDebt: number; // Общая сумма задолженности
        totalOverdueDebt: number; // Общая просроченная задолженность
        totalInvoices: number; // Общее количество счетов
        totalOverdueInvoices: number; // Общее количество просроченных счетов
        asOfDate: Date; // Дата расчета
    };
}

