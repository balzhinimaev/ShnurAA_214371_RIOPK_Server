// src/domain/enums/overdue-category.enum.ts

/**
 * Категории просрочек для анализа дебиторской задолженности.
 * Определяет рекомендуемые действия по взысканию долга.
 */
export enum OverdueCategory {
    /** Срок оплаты ещё не наступил (daysOverdue <= 0) */
    NOT_DUE = 'NOT_DUE',
    
    /** Оповестить дебитора - просрочка 1-30 дней */
    NOTIFY = 'NOTIFY',
    
    /** Направить претензию дебитору - просрочка 31-90 дней */
    CLAIM = 'CLAIM',
    
    /** Направить заявление в суд - просрочка 91-1095 дней (до 3 лет) */
    COURT = 'COURT',
    
    /** Признание безнадёжным долгом и списание - просрочка более 1095 дней (3 года) */
    BAD_DEBT = 'BAD_DEBT',
}

/**
 * Рекомендации по категориям просрочек
 */
export const OverdueCategoryRecommendations: Record<OverdueCategory, string> = {
    [OverdueCategory.NOT_DUE]: 'Срок оплаты ещё не наступил',
    [OverdueCategory.NOTIFY]: 'Оповестить дебитора (звонок, e-mail)',
    [OverdueCategory.CLAIM]: 'Направить претензию дебитору',
    [OverdueCategory.COURT]: 'Направить заявление в суд (только после претензии!)',
    [OverdueCategory.BAD_DEBT]: 'Признание безнадёжным долгом и списание',
};

/**
 * Границы дней просрочки для каждой категории
 */
export const OverdueCategoryBounds = {
    [OverdueCategory.NOT_DUE]: { min: -Infinity, max: 0 },
    [OverdueCategory.NOTIFY]: { min: 1, max: 30 },
    [OverdueCategory.CLAIM]: { min: 31, max: 90 },
    [OverdueCategory.COURT]: { min: 91, max: 1095 },
    [OverdueCategory.BAD_DEBT]: { min: 1096, max: Infinity },
};

/**
 * Определяет категорию просрочки на основе количества дней
 * @param daysOverdue - Количество дней просрочки (отрицательное = до срока оплаты)
 * @returns Категория просрочки
 */
export function getOverdueCategory(daysOverdue: number): OverdueCategory {
    if (daysOverdue <= 0) {
        return OverdueCategory.NOT_DUE;
    }
    if (daysOverdue >= 1 && daysOverdue <= 30) {
        return OverdueCategory.NOTIFY;
    }
    if (daysOverdue >= 31 && daysOverdue <= 90) {
        return OverdueCategory.CLAIM;
    }
    if (daysOverdue >= 91 && daysOverdue <= 1095) {
        return OverdueCategory.COURT;
    }
    // > 1095 дней (более 3 лет)
    return OverdueCategory.BAD_DEBT;
}

/**
 * Получает рекомендацию по категории просрочки
 * @param category - Категория просрочки
 * @returns Текст рекомендации
 */
export function getRecommendation(category: OverdueCategory): string {
    return OverdueCategoryRecommendations[category];
}

/**
 * Получает рекомендацию по количеству дней просрочки
 * @param daysOverdue - Количество дней просрочки
 * @returns Текст рекомендации
 */
export function getRecommendationByDays(daysOverdue: number): string {
    const category = getOverdueCategory(daysOverdue);
    return getRecommendation(category);
}

