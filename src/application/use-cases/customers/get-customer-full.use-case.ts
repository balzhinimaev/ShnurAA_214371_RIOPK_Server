// src/application/use-cases/customers/get-customer-full.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { AppError } from '../../errors/AppError';
import {
    CustomerFullResponseDto,
    CustomerInvoiceDto,
    CustomerStatisticsDto,
    RiskAssessmentDto,
    RiskFactorDto,
    PaymentRatingDto,
    getPaymentGrade,
    getRiskLevel,
} from '../../dtos/customers/customer-full-response.dto';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { getOverdueCategory } from '../../../domain/enums/overdue-category.enum';

// Расширяем интерфейс репозитория для получения счетов клиента
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    findAll(options: {
        filters?: { customerId?: string; status?: string };
        limit?: number;
        offset?: number;
    }): Promise<{ invoices: Invoice[]; total: number }>;
}

@injectable()
export class GetCustomerFullUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
    ) {}

    async execute(customerId: string): Promise<CustomerFullResponseDto> {
        const currentDate = new Date();

        // Получаем базовые данные клиента
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new AppError('Дебитор не найден', 404);
        }

        // Получаем все счета клиента (без ограничения по статусу)
        const { invoices: allInvoices } = await this.invoiceRepository.findAll({
            filters: { customerId },
            limit: 10000,
            offset: 0,
        });

        // Получаем историю работы с долгом
        let debtWorkRecords: any[] = [];
        try {
            const result = await this.debtWorkRecordRepository.findByCustomerId(customerId);
            debtWorkRecords = result.records || [];
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to get debt work records for customer ${customerId}:`, error);
        }

        // Фильтруем только неоплаченные счета для списка задолженностей
        const unpaidInvoices = allInvoices.filter(inv => inv.status !== 'PAID');
        
        // Преобразуем счета в DTO с расчетом просрочки
        const invoicesDto: CustomerInvoiceDto[] = unpaidInvoices.map(invoice => {
            const daysOverdue = this.calculateDaysOverdue(invoice.dueDate, currentDate);
            const overdueCategory = getOverdueCategory(daysOverdue);
            
            return {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount,
                outstandingAmount: invoice.outstandingAmount,
                dueDate: invoice.dueDate,
                daysOverdue,
                overdueCategory,
                status: invoice.status,
            };
        });

        // Вычисляем статистику
        const statistics = this.calculateStatistics(allInvoices, currentDate);

        // Вычисляем оценку рисков
        const riskAssessment = this.calculateRiskAssessment(
            allInvoices,
            debtWorkRecords,
            statistics,
            currentDate,
        );

        // Вычисляем рейтинг платежеспособности
        const hasCourtCases = debtWorkRecords.some(
            r => r.actionType === 'TRIAL' || r.actionType === 'COLLECTION'
        );
        const hasBadDebt = unpaidInvoices.some(inv => {
            const days = this.calculateDaysOverdue(inv.dueDate, currentDate);
            return days > 1095;
        });
        const paymentGradeData = getPaymentGrade(
            statistics.onTimePaymentRate,
            hasCourtCases,
            hasBadDebt,
        );

        const paymentRating: PaymentRatingDto = {
            grade: paymentGradeData.grade,
            description: paymentGradeData.description,
        };

        return {
            id: customer.id,
            name: customer.name,
            unp: customer.unp,
            contactInfo: customer.contactInfo,
            invoices: invoicesDto,
            statistics,
            riskAssessment,
            paymentRating,
        };
    }

    private calculateDaysOverdue(dueDate: Date, currentDate: Date): number {
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        const diffMs = currentDay.getTime() - dueDay.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    private calculateStatistics(invoices: Invoice[], currentDate: Date): CustomerStatisticsDto {
        const totalInvoices = invoices.length;
        
        // Счета с задолженностью
        const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID');

        // Общая и просроченная задолженность
        let totalDebt = 0;
        let overdueDebt = 0;

        for (const invoice of unpaidInvoices) {
            const outstanding = invoice.outstandingAmount;
            totalDebt += outstanding;
            
            const daysOverdue = this.calculateDaysOverdue(invoice.dueDate, currentDate);
            if (daysOverdue > 0) {
                overdueDebt += outstanding;
            }
        }

        // Статистика по оплатам
        let paidOnTimeCount = 0;
        let paidLateCount = 0;
        let totalPaymentDelay = 0;
        let paymentDelayCount = 0;

        for (const invoice of paidInvoices) {
            if (invoice.actualPaymentDate) {
                const paymentDelay = this.calculateDaysOverdue(
                    invoice.dueDate,
                    invoice.actualPaymentDate,
                );
                
                if (paymentDelay <= 0) {
                    paidOnTimeCount++;
                } else {
                    paidLateCount++;
                    totalPaymentDelay += paymentDelay;
                    paymentDelayCount++;
                }
            }
        }

        // Также учитываем частично оплаченные счета
        for (const invoice of unpaidInvoices) {
            if (invoice.paidAmount > 0 && invoice.actualPaymentDate) {
                const paymentDelay = this.calculateDaysOverdue(
                    invoice.dueDate,
                    invoice.actualPaymentDate,
                );
                
                if (paymentDelay > 0) {
                    totalPaymentDelay += paymentDelay;
                    paymentDelayCount++;
                }
            }
        }

        const averagePaymentDelay = paymentDelayCount > 0
            ? Math.round(totalPaymentDelay / paymentDelayCount)
            : 0;

        const totalPaidInvoices = paidOnTimeCount + paidLateCount;
        const onTimePaymentRate = totalPaidInvoices > 0
            ? Math.round((paidOnTimeCount / totalPaidInvoices) * 100)
            : 100; // Если нет оплаченных счетов, считаем 100%

        return {
            totalInvoices,
            totalDebt: Math.round(totalDebt * 100) / 100,
            overdueDebt: Math.round(overdueDebt * 100) / 100,
            paidOnTimeCount,
            paidLateCount,
            averagePaymentDelay,
            onTimePaymentRate,
        };
    }

    private calculateRiskAssessment(
        invoices: Invoice[],
        debtWorkRecords: any[],
        statistics: CustomerStatisticsDto,
        currentDate: Date,
    ): RiskAssessmentDto {
        const factors: RiskFactorDto[] = [];
        let totalScore = 0;

        // === Фактор 1: Процент просрочек ===
        const overdueRate = statistics.totalDebt > 0
            ? (statistics.overdueDebt / statistics.totalDebt) * 100
            : 0;

        if (overdueRate === 0) {
            factors.push({
                factor: 'Нет текущих просрочек',
                description: 'Все счета оплачиваются в срок',
                impact: 'POSITIVE',
                weight: -10,
            });
            totalScore -= 10;
        } else if (overdueRate > 50) {
            factors.push({
                factor: 'Высокий процент просрочек',
                description: `${Math.round(overdueRate)}% задолженности просрочено`,
                impact: 'NEGATIVE',
                weight: 25,
            });
            totalScore += 25;
        } else if (overdueRate > 20) {
            factors.push({
                factor: 'Средний процент просрочек',
                description: `${Math.round(overdueRate)}% задолженности просрочено`,
                impact: 'NEGATIVE',
                weight: 15,
            });
            totalScore += 15;
        }

        // === Фактор 2: История своевременных платежей ===
        if (statistics.onTimePaymentRate > 90) {
            factors.push({
                factor: 'Своевременные платежи',
                description: `${statistics.onTimePaymentRate}% счетов оплачено вовремя`,
                impact: 'POSITIVE',
                weight: -15,
            });
            totalScore -= 15;
        } else if (statistics.onTimePaymentRate < 50) {
            factors.push({
                factor: 'Частые просрочки оплат',
                description: `Только ${statistics.onTimePaymentRate}% счетов оплачено вовремя`,
                impact: 'NEGATIVE',
                weight: 20,
            });
            totalScore += 20;
        }

        // === Фактор 3: Крупная просроченная задолженность ===
        const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
        const hasLargeOverdue90 = unpaidInvoices.some(inv => {
            const days = this.calculateDaysOverdue(inv.dueDate, currentDate);
            return days > 90 && inv.outstandingAmount > 10000;
        });

        if (hasLargeOverdue90) {
            factors.push({
                factor: 'Крупный долг более 90 дней',
                description: 'Есть задолженность > 10,000 с просрочкой более 90 дней',
                impact: 'NEGATIVE',
                weight: 25,
            });
            totalScore += 25;
        }

        // === Фактор 4: Судебные иски ===
        const hasCourtActions = debtWorkRecords.some(
            r => r.actionType === 'TRIAL' || r.actionType === 'COLLECTION'
        );

        if (hasCourtActions) {
            factors.push({
                factor: 'Есть судебные иски',
                description: 'В истории есть обращения в суд',
                impact: 'NEGATIVE',
                weight: 30,
            });
            totalScore += 30;
        }

        // === Фактор 5: Претензии ===
        const hasClaimActions = debtWorkRecords.some(r => r.actionType === 'CLAIM');

        if (hasClaimActions) {
            factors.push({
                factor: 'Были направлены претензии',
                description: 'В истории есть направленные претензии',
                impact: 'NEGATIVE',
                weight: 10,
            });
            totalScore += 10;
        }

        // === Фактор 6: Безнадёжные долги (> 3 лет) ===
        const hasBadDebt = unpaidInvoices.some(inv => {
            const days = this.calculateDaysOverdue(inv.dueDate, currentDate);
            return days > 1095;
        });

        if (hasBadDebt) {
            factors.push({
                factor: 'Безнадёжные долги',
                description: 'Есть задолженность с просрочкой более 3 лет',
                impact: 'NEGATIVE',
                weight: 35,
            });
            totalScore += 35;
        }

        // === Фактор 7: Положительная динамика ===
        // Проверяем, уменьшилась ли задолженность за последние 6 месяцев
        const sixMonthsAgo = new Date(currentDate);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentPayments = invoices.filter(
            inv => inv.actualPaymentDate && inv.actualPaymentDate >= sixMonthsAgo
        );

        if (recentPayments.length > 3 && statistics.onTimePaymentRate > 75) {
            factors.push({
                factor: 'Положительная динамика',
                description: 'Активные платежи за последние 6 месяцев',
                impact: 'POSITIVE',
                weight: -10,
            });
            totalScore -= 10;
        }

        // Нормализуем score в диапазон 0-100
        const normalizedScore = Math.max(0, Math.min(100, totalScore + 30));
        const level = getRiskLevel(normalizedScore);

        // Если нет факторов, добавляем нейтральный
        if (factors.length === 0) {
            factors.push({
                factor: 'Недостаточно данных',
                description: 'Недостаточно истории для оценки риска',
                impact: 'NEUTRAL',
                weight: 0,
            });
        }

        return {
            level,
            score: normalizedScore,
            factors,
        };
    }
}

