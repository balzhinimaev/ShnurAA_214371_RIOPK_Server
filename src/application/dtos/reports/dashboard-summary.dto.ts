// src/application/dtos/reports/dashboard-summary.dto.ts
import { Expose, Type } from 'class-transformer';

class AgingBucketDto {
    @Expose()
    bucket!: string;

    @Expose()
    amount!: number;

    @Expose()
    count!: number;
}

export class DashboardSummaryDto {
    @Expose()
    totalReceivables!: number;

    @Expose()
    overdueReceivables!: number;

    @Expose()
    @Type(() => AgingBucketDto)
    agingStructure!: AgingBucketDto[];
}
