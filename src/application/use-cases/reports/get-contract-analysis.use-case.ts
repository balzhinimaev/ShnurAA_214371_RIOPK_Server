// src/application/use-cases/reports/get-contract-analysis.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    ContractAnalysisDto,
    ContractAnalysisContractDto,
    ContractAnalysisInvoiceDto,
} from '../../dtos/reports/contract-analysis.dto';
import { plainToInstance } from 'class-transformer';
import { Invoice } from '../../../domain/entities/invoice.entity';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getInvoicesByContract(
        asOfDate: Date,
        customerId?: string,
        contractNumber?: string,
    ): Promise<Invoice[]>;
}

export interface GetContractAnalysisOptions {
    asOfDate?: Date; // Дата расчета (по умолчанию - сегодня)
    customerId?: string; // Фильтр по контрагенту (опционально)
    contractNumber?: string; // Фильтр по номеру договора (опционально)
    includePaid?: boolean; // Включать ли оплаченные счета (по умолчанию false)
}

@injectable()
export class GetContractAnalysisUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(
        options: GetContractAnalysisOptions = {},
    ): Promise<ContractAnalysisDto> {
        const asOfDate = options.asOfDate || new Date();
        const includePaid = options.includePaid || false;

        // Получаем все счета с задолженностью, сгруппированные по договорам
        const invoices = await this.invoiceRepository.getInvoicesByContract(
            asOfDate,
            options.customerId,
            options.contractNumber,
        );

        // Фильтруем оплаченные счета, если нужно
        const filteredInvoices = includePaid
            ? invoices
            : invoices.filter((inv) => inv.status !== 'PAID');

        if (filteredInvoices.length === 0) {
            return this.createEmptyResult(asOfDate);
        }

        // Группируем счета по договорам
        const contractsMap = new Map<
            string,
            {
                contractNumber: string;
                customerId: string;
                customerName: string;
                customerUnp?: string;
                serviceType?: string;
                manager?: string;
                invoices: Invoice[];
            }
        >();

        for (const invoice of filteredInvoices) {
            // Используем contractNumber или создаем виртуальный идентификатор
            const contractKey =
                invoice.contractNumber ||
                `${invoice.customerId}_${invoice.serviceType || 'UNKNOWN'}`;
            const contractNumber =
                invoice.contractNumber || `Договор-${invoice.customerId}`;

            if (!contractsMap.has(contractKey)) {
                contractsMap.set(contractKey, {
                    contractNumber,
                    customerId: invoice.customerId,
                    customerName: invoice.customer?.name || 'Unknown Customer',
                    customerUnp: invoice.customer?.unp,
                    serviceType: invoice.serviceType,
                    manager: invoice.manager,
                    invoices: [],
                });
            }

            contractsMap.get(contractKey)!.invoices.push(invoice);
        }

        // Преобразуем в массив договоров с расчетом метрик
        const contracts: ContractAnalysisContractDto[] = Array.from(
            contractsMap.values(),
        ).map((contractData) => {
            const contractInvoices = contractData.invoices;
            const totalDebt = contractInvoices.reduce(
                (sum, inv) => sum + inv.outstandingAmount,
                0,
            );

            const overdueDebt = contractInvoices.reduce((sum, inv) => {
                if (inv.isOverdue(asOfDate)) {
                    return sum + inv.outstandingAmount;
                }
                return sum;
            }, 0);

            const currentDebt = totalDebt - overdueDebt;

            const overdueInvoiceCount = contractInvoices.filter((inv) =>
                inv.isOverdue(asOfDate),
            ).length;

            const oldestDebtDays = Math.max(
                ...contractInvoices.map((inv) => inv.getDaysOverdue(asOfDate)),
                0,
            );

            // Преобразуем счета в DTO
            const invoiceDtos: ContractAnalysisInvoiceDto[] =
                contractInvoices.map((inv) => ({
                    invoiceId: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    issueDate: inv.issueDate,
                    dueDate: inv.dueDate,
                    totalAmount: inv.totalAmount,
                    paidAmount: inv.paidAmount,
                    outstandingAmount: inv.outstandingAmount,
                    overdueAmount: inv.isOverdue(asOfDate)
                        ? inv.outstandingAmount
                        : 0,
                    daysOverdue: inv.getDaysOverdue(asOfDate),
                    status: inv.status,
                    debtWorkStatus: inv.debtWorkStatus,
                }));

            return {
                contractNumber: contractData.contractNumber,
                customerId: contractData.customerId,
                customerName: contractData.customerName,
                customerUnp: contractData.customerUnp,
                serviceType: contractData.serviceType,
                manager: contractData.manager,
                totalDebt: Math.round(totalDebt * 100) / 100,
                overdueDebt: Math.round(overdueDebt * 100) / 100,
                currentDebt: Math.round(currentDebt * 100) / 100,
                invoiceCount: contractInvoices.length,
                overdueInvoiceCount,
                oldestDebtDays,
                invoices: invoiceDtos,
            };
        });

        // Сортируем по общей задолженности (по убыванию)
        contracts.sort((a, b) => b.totalDebt - a.totalDebt);

        // Рассчитываем summary
        const totalDebt = contracts.reduce((sum, c) => sum + c.totalDebt, 0);
        const totalOverdueDebt = contracts.reduce(
            (sum, c) => sum + c.overdueDebt,
            0,
        );
        const totalInvoices = contracts.reduce(
            (sum, c) => sum + c.invoiceCount,
            0,
        );
        const totalOverdueInvoices = contracts.reduce(
            (sum, c) => sum + c.overdueInvoiceCount,
            0,
        );

        const result: ContractAnalysisDto = {
            contracts: plainToInstance(
                ContractAnalysisContractDto,
                contracts,
                { excludeExtraneousValues: false },
            ),
            summary: {
                totalContracts: contracts.length,
                totalDebt: Math.round(totalDebt * 100) / 100,
                totalOverdueDebt: Math.round(totalOverdueDebt * 100) / 100,
                totalInvoices,
                totalOverdueInvoices,
                asOfDate,
            },
        };

        return plainToInstance(ContractAnalysisDto, result, {
            excludeExtraneousValues: false,
        });
    }

    /**
     * Создает пустой результат анализа по договорам
     */
    private createEmptyResult(asOfDate: Date): ContractAnalysisDto {
        return plainToInstance(
            ContractAnalysisDto,
            {
                contracts: [],
                summary: {
                    totalContracts: 0,
                    totalDebt: 0,
                    totalOverdueDebt: 0,
                    totalInvoices: 0,
                    totalOverdueInvoices: 0,
                    asOfDate,
                },
            },
            { excludeExtraneousValues: false },
        );
    }
}

