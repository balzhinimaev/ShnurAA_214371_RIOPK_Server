// src/application/use-cases/reports/get-risk-concentration.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    RiskConcentrationDto,
    RiskConcentrationCustomerDto,
} from '../../dtos/reports/risk-concentration.dto';
import { plainToInstance } from 'class-transformer';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getAllCustomersWithDebt(asOfDate: Date): Promise<
        Array<{
            customerId: string;
            customerName: string;
            customerUnp?: string;
            totalDebt: number;
            overdueDebt: number;
            invoiceCount: number;
            oldestDebtDays: number;
        }>
    >;
}

export interface GetRiskConcentrationOptions {
    asOfDate?: Date; // Дата расчета (по умолчанию - сегодня)
    minPercentage?: number; // Минимальный процент для фильтрации (опционально)
    limit?: number; // Ограничение количества контрагентов (опционально)
}

@injectable()
export class GetRiskConcentrationUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(
        options: GetRiskConcentrationOptions = {},
    ): Promise<RiskConcentrationDto> {
        const asOfDate = options.asOfDate || new Date();

        // Получаем всех контрагентов с задолженностью, отсортированных по убыванию
        const customers = await this.invoiceRepository.getAllCustomersWithDebt(
            asOfDate,
        );

        if (customers.length === 0) {
            // Если нет контрагентов с задолженностью, возвращаем пустой результат
            return this.createEmptyResult(asOfDate);
        }

        // Рассчитываем общую сумму задолженности
        const totalDebt = customers.reduce(
            (sum, customer) => sum + customer.totalDebt,
            0,
        );

        // Рассчитываем процент от общей суммы для каждого контрагента
        const customersWithPercentage = customers.map((customer) => {
            const percentageOfTotal =
                totalDebt > 0
                    ? Math.round((customer.totalDebt / totalDebt) * 100 * 100) /
                      100
                    : 0;
            return {
                ...customer,
                percentageOfTotal,
            };
        });

        // Рассчитываем метрики концентрации на основе ВСЕХ контрагентов
        // (метрики показывают общую концентрацию рисков в портфеле)
        const maxConcentration =
            customersWithPercentage.length > 0
                ? customersWithPercentage[0].percentageOfTotal
                : 0;

        const top5Concentration = customersWithPercentage
            .slice(0, 5)
            .reduce((sum, c) => sum + c.percentageOfTotal, 0);

        const top10Concentration = customersWithPercentage
            .slice(0, 10)
            .reduce((sum, c) => sum + c.percentageOfTotal, 0);

        // Применяем фильтры для списка контрагентов в ответе (если указаны)
        let filteredCustomers = customersWithPercentage;
        if (options.minPercentage !== undefined) {
            filteredCustomers = filteredCustomers.filter(
                (c) => c.percentageOfTotal >= options.minPercentage!,
            );
        }
        if (options.limit !== undefined && options.limit > 0) {
            filteredCustomers = filteredCustomers.slice(0, options.limit);
        }

        // Формируем результат
        const result: RiskConcentrationDto = {
            customers: plainToInstance(
                RiskConcentrationCustomerDto,
                filteredCustomers,
                { excludeExtraneousValues: false },
            ),
            summary: {
                totalCustomers: customers.length,
                totalDebt: Math.round(totalDebt * 100) / 100,
                asOfDate,
                maxConcentration: Math.round(maxConcentration * 100) / 100,
                top5Concentration: Math.round(top5Concentration * 100) / 100,
                top10Concentration: Math.round(top10Concentration * 100) / 100,
            },
        };

        return plainToInstance(RiskConcentrationDto, result, {
            excludeExtraneousValues: false,
        });
    }

    /**
     * Создает пустой результат анализа концентрации рисков
     */
    private createEmptyResult(asOfDate: Date): RiskConcentrationDto {
        return plainToInstance(
            RiskConcentrationDto,
            {
                customers: [],
                summary: {
                    totalCustomers: 0,
                    totalDebt: 0,
                    asOfDate,
                    maxConcentration: 0,
                    top5Concentration: 0,
                    top10Concentration: 0,
                },
            },
            { excludeExtraneousValues: false },
        );
    }
}

