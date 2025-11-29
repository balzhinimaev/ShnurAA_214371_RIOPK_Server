// src/application/dtos/reports/recommendations-summary.dto.ts
import { Expose, Type } from 'class-transformer';
import { OverdueCategory } from '../../../domain/enums/overdue-category.enum';

/**
 * Статистика по категории
 */
export class CategoryStatsDto {
    @Expose()
    count!: number;

    @Expose()
    totalAmount!: number;
}

/**
 * Разбивка по категориям просрочки
 */
export class ByCategoryDto {
    @Expose()
    @Type(() => CategoryStatsDto)
    NOT_DUE!: CategoryStatsDto;

    @Expose()
    @Type(() => CategoryStatsDto)
    NOTIFY!: CategoryStatsDto;

    @Expose()
    @Type(() => CategoryStatsDto)
    CLAIM!: CategoryStatsDto;

    @Expose()
    @Type(() => CategoryStatsDto)
    COURT!: CategoryStatsDto;

    @Expose()
    @Type(() => CategoryStatsDto)
    BAD_DEBT!: CategoryStatsDto;
}

/**
 * Приоритетное действие по счету
 */
export class PriorityActionDto {
    @Expose()
    invoiceId!: string;

    @Expose()
    invoiceNumber!: string;

    @Expose()
    customerId!: string;

    @Expose()
    customerName!: string;

    @Expose()
    amount!: number;

    @Expose()
    daysOverdue!: number;

    @Expose()
    category!: OverdueCategory;

    @Expose()
    recommendation!: string;

    /** Была ли претензия (для категории COURT важно проверить) */
    @Expose()
    hasClaim!: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     RecommendationsSummaryDto:
 *       type: object
 *       description: Сводка рекомендаций по всем счетам
 *       properties:
 *         byCategory:
 *           type: object
 *           properties:
 *             NOT_DUE:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 totalAmount:
 *                   type: number
 *             NOTIFY:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 totalAmount:
 *                   type: number
 *             CLAIM:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 totalAmount:
 *                   type: number
 *             COURT:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 totalAmount:
 *                   type: number
 *             BAD_DEBT:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 totalAmount:
 *                   type: number
 *         priorityActions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PriorityActionDto'
 */
export class RecommendationsSummaryDto {
    @Expose()
    @Type(() => ByCategoryDto)
    byCategory!: ByCategoryDto;

    @Expose()
    @Type(() => PriorityActionDto)
    priorityActions!: PriorityActionDto[];
}

