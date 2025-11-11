// src/application/dtos/reports/dashboard-summary.dto.ts
import { Expose, Type } from 'class-transformer';

/**
 * @openapi
 * components:
 *   schemas:
 *     AgingBucketDto:
 *       type: object
 *       properties:
 *         bucket:
 *           type: string
 *           description: Название корзины старения (например, "Current", "1-30", "91+").
 *           example: "31-60"
 *         amount:
 *           type: number
 *           format: float
 *           description: Сумма неоплаченных остатков счетов в данной корзине.
 *           example: 100200.00
 *         count:
 *           type: number
 *           format: integer
 *           description: Количество счетов в данной корзине.
 *           example: 3
 *       required:
 *         - bucket
 *         - amount
 *         - count
 */
class AgingBucketDto {
    // Класс остается неэкспортируемым, используется через @Type
    @Expose()
    bucket!: string;

    @Expose()
    amount!: number;

    @Expose()
    count!: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DashboardSummaryDto:
 *       type: object
 *       properties:
 *         totalReceivables:
 *           type: number
 *           format: float
 *           description: Общая сумма текущей дебиторской задолженности (неоплаченные остатки).
 *           example: 1250600.75
 *         overdueReceivables:
 *           type: number
 *           format: float
 *           description: Сумма просроченной дебиторской задолженности.
 *           example: 315200.50
 *         overduePercentage:
 *           type: number
 *           format: float
 *           description: Процент просроченной задолженности от общей.
 *           example: 25.2
 *         currentReceivables:
 *           type: number
 *           format: float
 *           description: Сумма задолженности в срок (не просроченной).
 *           example: 935400.25
 *         averagePaymentDelayDays:
 *           type: number
 *           format: float
 *           description: Средний срок задержки оплаты (в днях).
 *           example: 15.5
 *         totalInvoicesCount:
 *           type: number
 *           format: integer
 *           description: Общее количество неоплаченных счетов.
 *           example: 42
 *         overdueInvoicesCount:
 *           type: number
 *           format: integer
 *           description: Количество просроченных счетов.
 *           example: 18
 *         agingStructure:
 *           type: array
 *           description: Структура дебиторской задолженности по срокам возникновения (старения).
 *           items:
 *             $ref: '#/components/schemas/AgingBucketDto' # Ссылка на схему корзины
 *       required:
 *         - totalReceivables
 *         - overdueReceivables
 *         - overduePercentage
 *         - currentReceivables
 *         - averagePaymentDelayDays
 *         - totalInvoicesCount
 *         - overdueInvoicesCount
 *         - agingStructure
 */
export class DashboardSummaryDto {
    @Expose()
    totalReceivables!: number;

    @Expose()
    overdueReceivables!: number;

    @Expose()
    overduePercentage!: number; // % просроченной ДЗ

    @Expose()
    currentReceivables!: number; // Непросроченная ДЗ

    @Expose()
    averagePaymentDelayDays!: number; // Средний срок просрочки

    @Expose()
    totalInvoicesCount!: number; // Общее количество счетов

    @Expose()
    overdueInvoicesCount!: number; // Количество просроченных счетов

    @Expose()
    @Type(() => AgingBucketDto)
    agingStructure!: AgingBucketDto[];
}
