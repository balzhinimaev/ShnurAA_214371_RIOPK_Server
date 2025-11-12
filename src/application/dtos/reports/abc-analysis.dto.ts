// src/application/dtos/reports/abc-analysis.dto.ts
import { Expose, Type } from 'class-transformer';

/**
 * DTO для контрагента в ABC-анализе
 */
export class AbcAnalysisCustomerDto {
    @Expose()
    customerId!: string;

    @Expose()
    customerName!: string;

    @Expose()
    customerUnp?: string;

    @Expose()
    totalDebt!: number;

    @Expose()
    overdueDebt!: number;

    @Expose()
    invoiceCount!: number;

    @Expose()
    oldestDebtDays!: number;

    @Expose()
    cumulativePercentage!: number; // Накопительный процент от общей суммы
}

/**
 * DTO для группы ABC-анализа
 */
export class AbcAnalysisGroupDto {
    @Expose()
    group!: 'A' | 'B' | 'C';

    @Expose()
    @Type(() => AbcAnalysisCustomerDto)
    customers!: AbcAnalysisCustomerDto[];

    @Expose()
    totalDebt!: number; // Общая задолженность группы

    @Expose()
    percentageOfTotal!: number; // Процент от общей суммы задолженности

    @Expose()
    customerCount!: number; // Количество контрагентов в группе

    @Expose()
    percentageOfCustomers!: number; // Процент от общего количества контрагентов
}

/**
 * DTO для результата ABC-анализа
 */
export class AbcAnalysisDto {
    @Expose()
    @Type(() => AbcAnalysisGroupDto)
    groupA!: AbcAnalysisGroupDto;

    @Expose()
    @Type(() => AbcAnalysisGroupDto)
    groupB!: AbcAnalysisGroupDto;

    @Expose()
    @Type(() => AbcAnalysisGroupDto)
    groupC!: AbcAnalysisGroupDto;

    @Expose()
    summary!: {
        totalCustomers: number; // Общее количество контрагентов
        totalDebt: number; // Общая сумма задолженности
        asOfDate: Date; // Дата расчета
    };
}

