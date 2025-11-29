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
 * Сводка по категориям для рекомендаций
 */
class RecommendationsCategorySummaryDto {
    @Expose()
    count!: number;

    @Expose()
    totalAmount!: number;
}

/**
 * Сводка рекомендаций по категориям для dashboard
 */
class RecommendationsSummaryForDashboardDto {
    @Expose()
    @Type(() => RecommendationsCategorySummaryDto)
    NOT_DUE!: RecommendationsCategorySummaryDto;

    @Expose()
    @Type(() => RecommendationsCategorySummaryDto)
    NOTIFY!: RecommendationsCategorySummaryDto;

    @Expose()
    @Type(() => RecommendationsCategorySummaryDto)
    CLAIM!: RecommendationsCategorySummaryDto;

    @Expose()
    @Type(() => RecommendationsCategorySummaryDto)
    COURT!: RecommendationsCategorySummaryDto;

    @Expose()
    @Type(() => RecommendationsCategorySummaryDto)
    BAD_DEBT!: RecommendationsCategorySummaryDto;
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
 *         averageReceivables:
 *           type: number
 *           format: float
 *           description: Средняя дебиторская задолженность за период (текущий месяц). Рассчитывается как (ДЗ на начало периода + ДЗ на конец периода) / 2.
 *           example: 250000.00
 *         turnoverRatio:
 *           type: number
 *           format: float
 *           description: Оборачиваемость дебиторской задолженности. Показывает, сколько раз за период ДЗ превратилась в денежные средства. Рассчитывается как выручка за период / средняя ДЗ.
 *           example: 4.5
 *         periodRevenue:
 *           type: number
 *           format: float
 *           description: Выручка за период (текущий месяц). Сумма всех счетов, созданных в текущем месяце.
 *           example: 1125000.00
 *         averagePaymentDays:
 *           type: number
 *           format: float
 *           description: Средний срок оплаты (от выставления счета до оплаты, в днях). Рассчитывается на основе истории платежей.
 *           example: 28.5
 *         onTimePaymentsAmount:
 *           type: number
 *           format: float
 *           description: Сумма платежей, которые были произведены в срок (paymentDate <= dueDate).
 *           example: 850000.00
 *         overduePaymentsPercentage:
 *           type: number
 *           format: float
 *           description: Процент просроченных платежей от общей суммы всех платежей. Рассчитывается на основе истории платежей.
 *           example: 15.3
 *       required:
 *         - totalReceivables
 *         - overdueReceivables
 *         - overduePercentage
 *         - currentReceivables
 *         - averagePaymentDelayDays
 *         - totalInvoicesCount
 *         - overdueInvoicesCount
 *         - agingStructure
 *         - averageReceivables
 *         - turnoverRatio
 *         - periodRevenue
 *         - averagePaymentDays
 *         - onTimePaymentsAmount
 *         - overduePaymentsPercentage
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

    @Expose()
    averageReceivables!: number; // Средняя ДЗ за период

    @Expose()
    turnoverRatio!: number; // Оборачиваемость ДЗ

    @Expose()
    periodRevenue!: number; // Выручка за период

    @Expose()
    averagePaymentDays!: number; // Средний срок оплаты (от выставления до оплаты)

    @Expose()
    onTimePaymentsAmount!: number; // Сумма платежей в срок

    @Expose()
    overduePaymentsPercentage!: number; // Процент просроченных платежей

    @Expose()
    @Type(() => RecommendationsSummaryForDashboardDto)
    recommendationsSummary?: RecommendationsSummaryForDashboardDto; // Сводка по категориям рекомендаций
}
