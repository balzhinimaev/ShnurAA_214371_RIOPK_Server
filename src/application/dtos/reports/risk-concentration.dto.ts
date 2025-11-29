// src/application/dtos/reports/risk-concentration.dto.ts
import { Expose, Type } from 'class-transformer';

/**
 * DTO для контрагента в анализе концентрации рисков
 */
export class RiskConcentrationCustomerDto {
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

    /**
     * Удельный вес задолженности контрагента в процентах от общей суммы ДЗ
     */
    @Expose()
    percentageOfTotal!: number;

    /**
     * Удельный вес просроченной задолженности контрагента в процентах от общей суммы просроченной ДЗ
     */
    @Expose()
    percentageOfOverdue!: number;
}

/**
 * DTO для результата анализа концентрации рисков
 */
export class RiskConcentrationDto {
    @Expose()
    @Type(() => RiskConcentrationCustomerDto)
    customers!: RiskConcentrationCustomerDto[];

    @Expose()
    summary!: {
        totalCustomers: number; // Общее количество контрагентов с задолженностью
        totalDebt: number; // Общая сумма задолженности
        totalOverdueDebt: number; // Общая сумма просроченной задолженности
        asOfDate: Date; // Дата расчета
        maxConcentration: number; // Максимальная концентрация (процент самого крупного должника)
        top5Concentration: number; // Концентрация топ-5 должников (%)
        top10Concentration: number; // Концентрация топ-10 должников (%)
    };
}

