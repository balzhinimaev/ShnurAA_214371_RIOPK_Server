// src/application/dtos/customers/debt-work-record.dto.ts
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsDateString, IsString, IsOptional, IsNumber, IsNotEmpty, Min, Matches, ValidateIf } from 'class-validator';
import { DebtWorkActionType } from '../../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../../domain/enums/debt-work-result.enum';

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

