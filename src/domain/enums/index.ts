// src/domain/enums/index.ts
// Централизованный экспорт всех enum'ов для удобства импорта

export { DebtWorkActionType } from './debt-work-action-type.enum';
export { DebtWorkResult } from './debt-work-result.enum';
export { RiskLevel } from './risk-level.enum';
export {
    OverdueCategory,
    OverdueCategoryRecommendations,
    OverdueCategoryBounds,
    getOverdueCategory,
    getRecommendation,
    getRecommendationByDays,
} from './overdue-category.enum';

