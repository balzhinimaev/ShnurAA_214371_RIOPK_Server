// src/application/use-cases/reports/get-dashboard-summary.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import { DashboardSummaryDto } from '../../dtos/reports/dashboard-summary.dto';
import { plainToInstance } from 'class-transformer';
import {
    OverdueCategory,
    getOverdueCategory,
} from '../../../domain/enums/overdue-category.enum';
import { Invoice } from '../../../domain/entities/invoice.entity';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    findAll(options: {
        filters?: { status?: string };
        limit?: number;
        offset?: number;
    }): Promise<{ invoices: Invoice[]; total: number }>;
}

@injectable()
export class GetDashboardSummaryUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(): Promise<DashboardSummaryDto> {
        const summaryData = await this.invoiceRepository.getDashboardSummary();

        // Вычисляем recommendationsSummary
        const recommendationsSummary = await this.calculateRecommendationsSummary();

        const summaryDto = plainToInstance(DashboardSummaryDto, {
            ...summaryData,
            recommendationsSummary,
        }, {
            excludeExtraneousValues: true,
        });

        return summaryDto;
    }

    private async calculateRecommendationsSummary(): Promise<{
        NOT_DUE: { count: number; totalAmount: number };
        NOTIFY: { count: number; totalAmount: number };
        CLAIM: { count: number; totalAmount: number };
        COURT: { count: number; totalAmount: number };
        BAD_DEBT: { count: number; totalAmount: number };
    }> {
        const currentDate = new Date();

        // Получаем все неоплаченные счета
        const { invoices: openInvoices } = await this.invoiceRepository.findAll({
            filters: { status: 'OPEN' },
            limit: 10000,
            offset: 0,
        });

        const { invoices: overdueInvoices } = await this.invoiceRepository.findAll({
            filters: { status: 'OVERDUE' },
            limit: 10000,
            offset: 0,
        });

        const allInvoices = [...openInvoices, ...overdueInvoices];

        // Инициализируем статистику
        const byCategory: Record<OverdueCategory, { count: number; totalAmount: number }> = {
            [OverdueCategory.NOT_DUE]: { count: 0, totalAmount: 0 },
            [OverdueCategory.NOTIFY]: { count: 0, totalAmount: 0 },
            [OverdueCategory.CLAIM]: { count: 0, totalAmount: 0 },
            [OverdueCategory.COURT]: { count: 0, totalAmount: 0 },
            [OverdueCategory.BAD_DEBT]: { count: 0, totalAmount: 0 },
        };

        // Обрабатываем каждый счет
        for (const invoice of allInvoices) {
            const outstandingAmount = invoice.outstandingAmount;
            if (outstandingAmount <= 0) continue;

            // Вычисляем дни просрочки
            const dueDate = new Date(invoice.dueDate);
            const diffMs = currentDate.getTime() - dueDate.getTime();
            const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            const category = getOverdueCategory(daysOverdue);

            byCategory[category].count++;
            byCategory[category].totalAmount += outstandingAmount;
        }

        // Округляем суммы
        Object.values(byCategory).forEach(stats => {
            stats.totalAmount = Math.round(stats.totalAmount * 100) / 100;
        });

        return {
            NOT_DUE: byCategory[OverdueCategory.NOT_DUE],
            NOTIFY: byCategory[OverdueCategory.NOTIFY],
            CLAIM: byCategory[OverdueCategory.CLAIM],
            COURT: byCategory[OverdueCategory.COURT],
            BAD_DEBT: byCategory[OverdueCategory.BAD_DEBT],
        };
    }
}
