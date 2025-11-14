// src/domain/entities/debt-work-record.entity.ts
import { DebtWorkActionType } from '../enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../enums/debt-work-result.enum';
import { RiskLevel } from '../enums/risk-level.enum';

// Re-export для обратной совместимости (если где-то используется прямой импорт из entity)
export { DebtWorkActionType } from '../enums/debt-work-action-type.enum';
export { DebtWorkResult } from '../enums/debt-work-result.enum';
export { RiskLevel } from '../enums/risk-level.enum';

export class DebtWorkRecord {
    public readonly id: string;
    public customerId: string;
    public invoiceId?: string; // Опционально - может быть связан с конкретным счетом
    public actionType: DebtWorkActionType;
    public actionDate: Date;
    public performedBy: string; // ID пользователя, выполнившего действие
    public result: DebtWorkResult;
    public description?: string;
    public nextActionDate?: Date; // Дата следующего запланированного действия
    public amount?: number; // Сумма задолженности на момент действия
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: {
        id: string;
        customerId: string;
        invoiceId?: string;
        actionType: DebtWorkActionType;
        actionDate: Date;
        performedBy: string;
        result: DebtWorkResult;
        description?: string;
        nextActionDate?: Date;
        amount?: number;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.customerId = props.customerId;
        this.invoiceId = props.invoiceId;
        this.actionType = props.actionType;
        this.actionDate = props.actionDate;
        this.performedBy = props.performedBy;
        this.result = props.result;
        this.description = props.description;
        this.nextActionDate = props.nextActionDate;
        this.amount = props.amount;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}

export class CustomerDebtWorkStats {
    public totalDebtWorkRecords: number;
    public totalCalls: number;
    public totalLegalActions: number;
    public lastContactDate?: Date;
    public totalDebtEpisodes: number; // Количество эпизодов задолженности
    public averageDebtResolutionDays: number; // Среднее время погашения в днях
    public longestDebtDays: number; // Самая долгая задолженность в днях
    public riskScore: number; // Оценка рисковости (0-100)
    public riskLevel: RiskLevel; // Уровень риска

    constructor(props: {
        totalDebtWorkRecords: number;
        totalCalls: number;
        totalLegalActions: number;
        lastContactDate?: Date;
        totalDebtEpisodes: number;
        averageDebtResolutionDays: number;
        longestDebtDays: number;
        riskScore: number;
        riskLevel: RiskLevel;
    }) {
        this.totalDebtWorkRecords = props.totalDebtWorkRecords;
        this.totalCalls = props.totalCalls;
        this.totalLegalActions = props.totalLegalActions;
        this.lastContactDate = props.lastContactDate;
        this.totalDebtEpisodes = props.totalDebtEpisodes;
        this.averageDebtResolutionDays = props.averageDebtResolutionDays;
        this.longestDebtDays = props.longestDebtDays;
        this.riskScore = props.riskScore;
        this.riskLevel = props.riskLevel;
    }
}

