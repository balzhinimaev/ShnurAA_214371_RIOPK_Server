// src/domain/enums/risk-level.enum.ts

/**
 * Уровень риска клиента на основе оценки рисковости (riskScore)
 */
export enum RiskLevel {
    LOW = 'LOW',           // Низкий риск (0-30 баллов)
    MEDIUM = 'MEDIUM',     // Средний риск (31-60 баллов)
    HIGH = 'HIGH',         // Высокий риск (61-80 баллов)
    CRITICAL = 'CRITICAL'  // Критический риск (81-100 баллов)
}

