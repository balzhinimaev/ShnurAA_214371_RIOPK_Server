// src/application/dtos/customers/debt-work-record.dto.ts
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsDateString, IsString, IsOptional, IsNumber, IsNotEmpty, Min, Matches, ValidateIf } from 'class-validator';
import { DebtWorkActionType } from '../../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../../domain/enums/debt-work-result.enum';

/**
 * @openapi
 * components:
 *   schemas:
 *     DebtWorkRecordDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор записи
 *         customerId:
 *           type: string
 *           description: ID клиента
 *         invoiceId:
 *           type: string
 *           description: ID счета (опционально)
 *         actionType:
 *           type: string
 *           enum: [CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER]
 *           description: Тип действия
 *         actionDate:
 *           type: string
 *           format: date-time
 *           description: Дата действия
 *         performedBy:
 *           type: string
 *           description: ID пользователя, выполнившего действие
 *         result:
 *           type: string
 *           enum: [CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Результат действия
 *         description:
 *           type: string
 *           description: Описание действия
 *         nextActionDate:
 *           type: string
 *           format: date-time
 *           description: Дата следующего запланированного действия
 *         amount:
 *           type: number
 *           description: Сумма задолженности на момент действия
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления записи
 *       required:
 *         - id
 *         - customerId
 *         - actionType
 *         - actionDate
 *         - performedBy
 *         - result
 *         - createdAt
 *         - updatedAt
 */
export class DebtWorkRecordDto {
    @Expose()
    id!: string;

    @Expose()
    customerId!: string;

    @Expose()
    invoiceId?: string;

    @Expose()
    actionType!: DebtWorkActionType;

    @Expose()
    @Type(() => Date)
    actionDate!: Date;

    @Expose()
    performedBy!: string;

    @Expose()
    result!: DebtWorkResult;

    @Expose()
    description?: string;

    @Expose()
    @Type(() => Date)
    nextActionDate?: Date;

    @Expose()
    amount?: number;

    @Expose()
    @Type(() => Date)
    createdAt!: Date;

    @Expose()
    @Type(() => Date)
    updatedAt!: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateDebtWorkRecordDto:
 *       type: object
 *       properties:
 *         invoiceId:
 *           type: string
 *           description: ID счета (опционально, 24-символьная hex-строка ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         actionType:
 *           type: string
 *           enum: [CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER]
 *           description: Тип действия
 *           example: "CALL"
 *         actionDate:
 *           type: string
 *           format: date-time
 *           description: Дата действия в формате ISO 8601
 *           example: "2024-01-15T10:30:00Z"
 *         result:
 *           type: string
 *           enum: [CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Результат действия
 *           example: "CONTACTED"
 *         description:
 *           type: string
 *           description: Описание действия
 *           example: "Позвонили клиенту, договорились о сроке оплаты"
 *         nextActionDate:
 *           type: string
 *           format: date-time
 *           description: Дата следующего запланированного действия
 *           example: "2024-01-20T10:00:00Z"
 *         amount:
 *           type: number
 *           description: Сумма задолженности на момент действия
 *           example: 15000.50
 *       required:
 *         - actionType
 *         - actionDate
 *         - result
 */
export class CreateDebtWorkRecordDto {
    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.invoiceId !== undefined && o.invoiceId !== null && o.invoiceId !== '')
    @Matches(/^[0-9a-fA-F]{24}$/, {
        message: 'invoiceId must be a valid 24-character hexadecimal ObjectId string'
    })
    invoiceId?: string;

    @IsNotEmpty()
    @IsEnum(DebtWorkActionType, {
        message: 'actionType must be one of: CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER'
    })
    actionType!: DebtWorkActionType;

    @IsNotEmpty()
    @IsDateString({}, {
        message: 'actionDate must be a valid ISO date string'
    })
    actionDate!: string;

    @IsNotEmpty()
    @IsEnum(DebtWorkResult, {
        message: 'result must be one of: CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED'
    })
    result!: DebtWorkResult;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString({}, {
        message: 'nextActionDate must be a valid ISO date string'
    })
    nextActionDate?: string;

    @IsOptional()
    @IsNumber({}, {
        message: 'amount must be a number'
    })
    @Min(0, {
        message: 'amount must be greater than or equal to 0'
    })
    amount?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerDebtWorkStatsDto:
 *       type: object
 *       description: Статистика работы с задолженностью клиента
 *       properties:
 *         totalDebtWorkRecords:
 *           type: integer
 *           description: Общее количество записей о работе с задолженностью
 *         totalCalls:
 *           type: integer
 *           description: Общее количество звонков
 *         totalLegalActions:
 *           type: integer
 *           description: Общее количество юридических действий
 *         lastContactDate:
 *           type: string
 *           format: date-time
 *           description: Дата последнего контакта
 *         totalDebtEpisodes:
 *           type: integer
 *           description: Количество эпизодов задолженности
 *         averageDebtResolutionDays:
 *           type: number
 *           description: Среднее время погашения в днях
 *         longestDebtDays:
 *           type: integer
 *           description: Самая долгая задолженность в днях
 *         riskScore:
 *           type: number
 *           description: Оценка рисковости (0-100)
 *         riskLevel:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Уровень риска
 */
export class CustomerDebtWorkStatsDto {
    @Expose()
    totalDebtWorkRecords!: number;

    @Expose()
    totalCalls!: number;

    @Expose()
    totalLegalActions!: number;

    @Expose()
    @Type(() => Date)
    lastContactDate?: Date;

    @Expose()
    totalDebtEpisodes!: number;

    @Expose()
    averageDebtResolutionDays!: number;

    @Expose()
    longestDebtDays!: number;

    @Expose()
    riskScore!: number;

    @Expose()
    riskLevel!: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DebtWorkHistoryResponseDto:
 *       type: object
 *       description: Ответ с историей работы с задолженностью и статистикой
 *       properties:
 *         records:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DebtWorkRecordDto'
 *           description: Список записей о работе с задолженностью
 *         stats:
 *           $ref: '#/components/schemas/CustomerDebtWorkStatsDto'
 *           description: Статистика работы с задолженностью
 *         total:
 *           type: integer
 *           description: Общее количество записей
 *         offset:
 *           type: integer
 *           description: Смещение для пагинации
 *         limit:
 *           type: integer
 *           description: Лимит записей на странице
 */
export class DebtWorkHistoryResponseDto {
    @Expose()
    @Type(() => DebtWorkRecordDto)
    records!: DebtWorkRecordDto[];

    @Expose()
    @Type(() => CustomerDebtWorkStatsDto)
    stats!: CustomerDebtWorkStatsDto;

    @Expose()
    total!: number;

    @Expose()
    offset!: number;

    @Expose()
    limit!: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateDebtWorkRecordDto:
 *       type: object
 *       description: DTO для обновления записи о работе с задолженностью. Все поля опциональны - обновляются только переданные поля.
 *       properties:
 *         invoiceId:
 *           type: string
 *           description: ID счета (24-символьная hex-строка ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         actionType:
 *           type: string
 *           enum: [CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER]
 *           description: Тип действия
 *           example: "EMAIL"
 *         actionDate:
 *           type: string
 *           format: date-time
 *           description: Дата действия в формате ISO 8601
 *           example: "2024-01-16T14:00:00Z"
 *         result:
 *           type: string
 *           enum: [CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Результат действия
 *           example: "PROMISED_PAY"
 *         description:
 *           type: string
 *           description: Описание действия
 *           example: "Отправлено напоминание по email, клиент обещал оплатить до конца недели"
 *         nextActionDate:
 *           type: string
 *           format: date-time
 *           description: Дата следующего запланированного действия
 *           example: "2024-01-22T10:00:00Z"
 *         amount:
 *           type: number
 *           description: Сумма задолженности на момент действия
 *           example: 12000.00
 */
export class UpdateDebtWorkRecordDto {
    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.invoiceId !== undefined && o.invoiceId !== null && o.invoiceId !== '')
    @Matches(/^[0-9a-fA-F]{24}$/, {
        message: 'invoiceId must be a valid 24-character hexadecimal ObjectId string'
    })
    invoiceId?: string;

    @IsOptional()
    @IsEnum(DebtWorkActionType, {
        message: 'actionType must be one of: CALL, EMAIL, SMS, LETTER, CLAIM, COURT_CLAIM, COURT_DECISION, EXECUTION, SETTLEMENT, PAYMENT_PLAN, OTHER'
    })
    actionType?: DebtWorkActionType;

    @IsOptional()
    @IsDateString({}, {
        message: 'actionDate must be a valid ISO date string'
    })
    actionDate?: string;

    @IsOptional()
    @IsEnum(DebtWorkResult, {
        message: 'result must be one of: CONTACTED, NO_CONTACT, PROMISED_PAY, REFUSED, PARTIAL_PAY, FULL_PAY, IN_PROGRESS, COMPLETED, CANCELLED'
    })
    result?: DebtWorkResult;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString({}, {
        message: 'nextActionDate must be a valid ISO date string'
    })
    nextActionDate?: string;

    @IsOptional()
    @IsNumber({}, {
        message: 'amount must be a number'
    })
    @Min(0, {
        message: 'amount must be greater than or equal to 0'
    })
    amount?: number;
}

