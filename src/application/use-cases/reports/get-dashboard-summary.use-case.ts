// src/application/use-cases/reports/get-dashboard-summary.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import { DashboardSummaryDto } from '../../dtos/reports/dashboard-summary.dto';
import { plainToInstance } from 'class-transformer';

@injectable()
export class GetDashboardSummaryUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepository,
    ) {}

    async execute(): Promise<DashboardSummaryDto> {
        const summaryData = await this.invoiceRepository.getDashboardSummary();

        const summaryDto = plainToInstance(DashboardSummaryDto, summaryData, {
            excludeExtraneousValues: true, // Важно для DTO
        });

        return summaryDto;
    }
}
