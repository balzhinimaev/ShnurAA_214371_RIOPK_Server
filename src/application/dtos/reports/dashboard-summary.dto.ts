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
 *         agingStructure:
 *           type: array
 *           description: Структура дебиторской задолженности по срокам возникновения (старения).
 *           items:
 *             $ref: '#/components/schemas/AgingBucketDto' # Ссылка на схему корзины
 *       required:
 *         - totalReceivables
 *         - overdueReceivables
 *         - agingStructure
 */
export class DashboardSummaryDto {
    @Expose()
    totalReceivables!: number;

    @Expose()
    overdueReceivables!: number;

    @Expose()
    @Type(() => AgingBucketDto)
    agingStructure!: AgingBucketDto[];
}
