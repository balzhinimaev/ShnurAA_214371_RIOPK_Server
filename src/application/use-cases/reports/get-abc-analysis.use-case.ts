// src/application/use-cases/reports/get-abc-analysis.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    AbcAnalysisDto,
    AbcAnalysisGroupDto,
    AbcAnalysisCustomerDto,
} from '../../dtos/reports/abc-analysis.dto';
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

export interface GetAbcAnalysisOptions {
    asOfDate?: Date; // Дата расчета (по умолчанию - сегодня)
}

@injectable()
export class GetAbcAnalysisUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(
        options: GetAbcAnalysisOptions = {},
    ): Promise<AbcAnalysisDto> {
        const asOfDate = options.asOfDate || new Date();

        // Получаем всех контрагентов с задолженностью, отсортированных по убыванию
        const customers = await this.invoiceRepository.getAllCustomersWithDebt(
            asOfDate,
        );

        if (customers.length === 0) {
            // Если нет контрагентов с задолженностью, возвращаем пустые группы
            return this.createEmptyResult(asOfDate);
        }

        // Рассчитываем общую сумму задолженности
        const totalDebt = customers.reduce(
            (sum, customer) => sum + customer.totalDebt,
            0,
        );

        // Рассчитываем накопительный процент для каждого контрагента
        let cumulativeDebt = 0;
        const customersWithCumulative = customers.map((customer) => {
            cumulativeDebt += customer.totalDebt;
            const cumulativePercentage = (cumulativeDebt / totalDebt) * 100;
            return {
                ...customer,
                cumulativePercentage: Math.round(cumulativePercentage * 100) / 100, // Округляем до 2 знаков
            };
        });

        // Разделяем на группы по принципу Парето
        // Группа A: до 80% накопительного процента включительно
        // Группа B: от 80% (не включая) до 95% включительно
        // Группа C: от 95% (не включая) до 100%
        // Примечание: если накопительный процент ровно 80% или 95%, контрагент попадает в соответствующую группу
        const groupA: typeof customersWithCumulative = [];
        const groupB: typeof customersWithCumulative = [];
        const groupC: typeof customersWithCumulative = [];

        for (const customer of customersWithCumulative) {
            if (customer.cumulativePercentage <= 80) {
                groupA.push(customer);
            } else if (customer.cumulativePercentage <= 95) {
                groupB.push(customer);
            } else {
                groupC.push(customer);
            }
        }

        // Рассчитываем метрики для каждой группы
        const groupADebt = groupA.reduce(
            (sum, c) => sum + c.totalDebt,
            0,
        );
        const groupBDebt = groupB.reduce(
            (sum, c) => sum + c.totalDebt,
            0,
        );
        const groupCDebt = groupC.reduce(
            (sum, c) => sum + c.totalDebt,
            0,
        );

        const totalCustomers = customers.length;

        // Формируем результат
        const result: AbcAnalysisDto = {
            groupA: {
                group: 'A',
                customers: plainToInstance(
                    AbcAnalysisCustomerDto,
                    groupA,
                    { excludeExtraneousValues: false },
                ),
                totalDebt: Math.round(groupADebt * 100) / 100,
                percentageOfTotal:
                    totalDebt > 0
                        ? Math.round((groupADebt / totalDebt) * 100 * 100) / 100
                        : 0,
                customerCount: groupA.length,
                percentageOfCustomers:
                    totalCustomers > 0
                        ? Math.round(
                              (groupA.length / totalCustomers) * 100 * 100,
                          ) / 100
                        : 0,
            },
            groupB: {
                group: 'B',
                customers: plainToInstance(
                    AbcAnalysisCustomerDto,
                    groupB,
                    { excludeExtraneousValues: false },
                ),
                totalDebt: Math.round(groupBDebt * 100) / 100,
                percentageOfTotal:
                    totalDebt > 0
                        ? Math.round((groupBDebt / totalDebt) * 100 * 100) / 100
                        : 0,
                customerCount: groupB.length,
                percentageOfCustomers:
                    totalCustomers > 0
                        ? Math.round(
                              (groupB.length / totalCustomers) * 100 * 100,
                          ) / 100
                        : 0,
            },
            groupC: {
                group: 'C',
                customers: plainToInstance(
                    AbcAnalysisCustomerDto,
                    groupC,
                    { excludeExtraneousValues: false },
                ),
                totalDebt: Math.round(groupCDebt * 100) / 100,
                percentageOfTotal:
                    totalDebt > 0
                        ? Math.round((groupCDebt / totalDebt) * 100 * 100) / 100
                        : 0,
                customerCount: groupC.length,
                percentageOfCustomers:
                    totalCustomers > 0
                        ? Math.round(
                              (groupC.length / totalCustomers) * 100 * 100,
                          ) / 100
                        : 0,
            },
            summary: {
                totalCustomers,
                totalDebt: Math.round(totalDebt * 100) / 100,
                asOfDate,
            },
        };

        return plainToInstance(AbcAnalysisDto, result, {
            excludeExtraneousValues: false,
        });
    }

    /**
     * Создает пустой результат ABC-анализа (когда нет контрагентов с задолженностью)
     */
    private createEmptyResult(asOfDate: Date): AbcAnalysisDto {
        const emptyGroup: AbcAnalysisGroupDto = {
            group: 'A',
            customers: [],
            totalDebt: 0,
            percentageOfTotal: 0,
            customerCount: 0,
            percentageOfCustomers: 0,
        };

        return plainToInstance(
            AbcAnalysisDto,
            {
                groupA: { ...emptyGroup, group: 'A' },
                groupB: { ...emptyGroup, group: 'B' },
                groupC: { ...emptyGroup, group: 'C' },
                summary: {
                    totalCustomers: 0,
                    totalDebt: 0,
                    asOfDate,
                },
            },
            { excludeExtraneousValues: false },
        );
    }
}

