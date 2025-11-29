// src/application/dtos/customers/customer-full-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { OverdueCategory } from '../../../domain/enums/overdue-category.enum';

/**
 * Счет в контексте данных дебитора
 */
export class CustomerInvoiceDto {
    @Expose()
    id!: string;

    @Expose()
    invoiceNumber!: string;

    @Expose()
    totalAmount!: number;

    @Expose()
    outstandingAmount!: number;

    @Expose()
    dueDate!: Date;

    @Expose()
    daysOverdue!: number;

    @Expose()
    overdueCategory!: OverdueCategory;

    @Expose()
    status!: string;
}

/**
 * Агрегированная статистика дебитора
 */
export class CustomerStatisticsDto {
    /** Общее количество счетов */
    @Expose()
    totalInvoices!: number;

    /** Общая задолженность */
    @Expose()
    totalDebt!: number;

    /** Просроченная задолженность */
    @Expose()
    overdueDebt!: number;

    /** Количество счетов, оплаченных вовремя */
    @Expose()
    paidOnTimeCount!: number;

    /** Количество счетов с просроченной оплатой */
    @Expose()
    paidLateCount!: number;

    /** Средняя задержка оплаты в днях */
    @Expose()
    averagePaymentDelay!: number;

    /** Процент своевременных оплат (0-100) */
    @Expose()
    onTimePaymentRate!: number;
}

/**
 * Фактор риска
 */
export class RiskFactorDto {
    /** Название фактора */
    @Expose()
    factor!: string;

    /** Описание влияния */
    @Expose()
    description!: string;

    /** Тип влияния */
    @Expose()
    impact!: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

    /** Вклад в итоговую оценку */
    @Expose()
    weight!: number;
}

/**
 * Оценка рисков дебитора
 */
export class RiskAssessmentDto {
    /** Уровень риска */
    @Expose()
    level!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    /** Оценка риска (0-100) */
    @Expose()
    score!: number;

    /** Факторы, влияющие на оценку */
    @Expose()
    @Type(() => RiskFactorDto)
    factors!: RiskFactorDto[];
}

/**
 * Рейтинг платежеспособности
 */
export class PaymentRatingDto {
    /** Оценка: A-F */
    @Expose()
    grade!: 'A' | 'B' | 'C' | 'D' | 'F';

    /** Описание оценки */
    @Expose()
    description!: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerFullResponseDto:
 *       type: object
 *       description: Полные данные о дебиторе с аналитикой
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         unp:
 *           type: string
 *         contactInfo:
 *           type: string
 *         invoices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerInvoiceDto'
 *         statistics:
 *           $ref: '#/components/schemas/CustomerStatisticsDto'
 *         riskAssessment:
 *           $ref: '#/components/schemas/RiskAssessmentDto'
 *         paymentRating:
 *           $ref: '#/components/schemas/PaymentRatingDto'
 */
export class CustomerFullResponseDto {
    // === Базовые данные дебитора ===
    @Expose()
    id!: string;

    @Expose()
    name!: string;

    @Expose()
    unp?: string;

    @Expose()
    contactInfo?: string;

    // === Список задолженностей ===
    @Expose()
    @Type(() => CustomerInvoiceDto)
    invoices!: CustomerInvoiceDto[];

    // === Агрегированная статистика ===
    @Expose()
    @Type(() => CustomerStatisticsDto)
    statistics!: CustomerStatisticsDto;

    // === Обоснование уровня риска ===
    @Expose()
    @Type(() => RiskAssessmentDto)
    riskAssessment!: RiskAssessmentDto;

    // === Общая оценка по своевременности ===
    @Expose()
    @Type(() => PaymentRatingDto)
    paymentRating!: PaymentRatingDto;
}

/**
 * Определяет оценку платежеспособности на основе процента своевременных оплат
 * @param onTimePaymentRate - Процент своевременных оплат (0-100)
 * @param hasCourtCases - Есть ли судебные иски
 * @param hasBadDebt - Есть ли безнадежные долги
 * @returns Оценка и описание
 */
export function getPaymentGrade(
    onTimePaymentRate: number,
    hasCourtCases: boolean = false,
    hasBadDebt: boolean = false,
): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; description: string } {
    // F = Злостный неплательщик
    if (hasCourtCases || hasBadDebt) {
        return {
            grade: 'F',
            description: 'Злостный неплательщик (судебные иски, безнадёжные долги)',
        };
    }
    
    // A = Отличный плательщик (>90% вовремя)
    if (onTimePaymentRate > 90) {
        return {
            grade: 'A',
            description: 'Отличный плательщик (>90% вовремя)',
        };
    }
    
    // B = Хороший плательщик (75-90% вовремя)
    if (onTimePaymentRate >= 75) {
        return {
            grade: 'B',
            description: 'Хороший плательщик (75-90% вовремя)',
        };
    }
    
    // C = Удовлетворительно (50-75% вовремя)
    if (onTimePaymentRate >= 50) {
        return {
            grade: 'C',
            description: 'Удовлетворительно (50-75% вовремя)',
        };
    }
    
    // D = Ненадёжный (<50% вовремя)
    return {
        grade: 'D',
        description: 'Ненадёжный плательщик (<50% вовремя)',
    };
}

/**
 * Определяет уровень риска на основе score
 * @param score - Оценка риска (0-100)
 * @returns Уровень риска
 */
export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score <= 25) return 'LOW';
    if (score <= 50) return 'MEDIUM';
    if (score <= 75) return 'HIGH';
    return 'CRITICAL';
}

