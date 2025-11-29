// src/application/use-cases/reports/get-recommendations.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    OverdueCategory,
    getOverdueCategory,
    getRecommendation,
} from '../../../domain/enums/overdue-category.enum';
import {
    RecommendationsSummaryDto,
    CategoryStatsDto,
    PriorityActionDto,
} from '../../dtos/reports/recommendations-summary.dto';
import { Invoice } from '../../../domain/entities/invoice.entity';

// Расширяем интерфейс репозитория для получения всех счетов
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    findAll(options: {
        filters?: { status?: string };
        limit?: number;
        offset?: number;
    }): Promise<{ invoices: Invoice[]; total: number }>;
}

@injectable()
export class GetRecommendationsUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(): Promise<RecommendationsSummaryDto> {
        const currentDate = new Date();
        
        // Получаем все неоплаченные счета
        const { invoices } = await this.invoiceRepository.findAll({
            filters: { status: 'OPEN' },
            limit: 10000, // Берем все счета
            offset: 0,
        });

        // Также получаем просроченные счета
        const { invoices: overdueInvoices } = await this.invoiceRepository.findAll({
            filters: { status: 'OVERDUE' },
            limit: 10000,
            offset: 0,
        });

        // Объединяем счета
        const allInvoices = [...invoices, ...overdueInvoices];

        // Инициализируем статистику по категориям
        const byCategory: Record<OverdueCategory, CategoryStatsDto> = {
            [OverdueCategory.NOT_DUE]: { count: 0, totalAmount: 0 },
            [OverdueCategory.NOTIFY]: { count: 0, totalAmount: 0 },
            [OverdueCategory.CLAIM]: { count: 0, totalAmount: 0 },
            [OverdueCategory.COURT]: { count: 0, totalAmount: 0 },
            [OverdueCategory.BAD_DEBT]: { count: 0, totalAmount: 0 },
        };

        const priorityActions: PriorityActionDto[] = [];

        // Обрабатываем каждый счет
        for (const invoice of allInvoices) {
            const outstandingAmount = invoice.outstandingAmount;
            if (outstandingAmount <= 0) continue;

            // Вычисляем дни просрочки
            const daysOverdue = this.calculateDaysOverdue(invoice.dueDate, currentDate);
            const category = getOverdueCategory(daysOverdue);

            // Обновляем статистику по категориям
            byCategory[category].count++;
            byCategory[category].totalAmount += outstandingAmount;

            // Добавляем в приоритетные действия (только просроченные)
            if (daysOverdue > 0) {
                // Проверяем, была ли претензия (по debtWorkStatus)
                const hasClaim = invoice.debtWorkStatus === 'CLAIM' ||
                    invoice.debtWorkStatus === 'PRE_TRIAL' ||
                    invoice.debtWorkStatus === 'TRIAL' ||
                    invoice.debtWorkStatus === 'COLLECTION';

                priorityActions.push({
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    customerId: invoice.customerId,
                    customerName: invoice.customer?.name || 'Неизвестный дебитор',
                    amount: outstandingAmount,
                    daysOverdue,
                    category,
                    recommendation: getRecommendation(category),
                    hasClaim,
                });
            }
        }

        // Сортируем приоритетные действия по дням просрочки (самые старые первыми)
        priorityActions.sort((a, b) => b.daysOverdue - a.daysOverdue);

        // Округляем суммы
        Object.values(byCategory).forEach(stats => {
            stats.totalAmount = Math.round(stats.totalAmount * 100) / 100;
        });

        return {
            byCategory: {
                NOT_DUE: byCategory[OverdueCategory.NOT_DUE],
                NOTIFY: byCategory[OverdueCategory.NOTIFY],
                CLAIM: byCategory[OverdueCategory.CLAIM],
                COURT: byCategory[OverdueCategory.COURT],
                BAD_DEBT: byCategory[OverdueCategory.BAD_DEBT],
            },
            priorityActions,
        };
    }

    private calculateDaysOverdue(dueDate: Date, currentDate: Date): number {
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        const diffMs = currentDay.getTime() - dueDay.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
}

