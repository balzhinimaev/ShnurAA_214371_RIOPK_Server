// src/application/use-cases/customers/list-customers.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    FindAllCustomersOptions,
} from '../../../domain/repositories/ICustomerRepository';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { ListCustomersResponseDto } from '../../dtos/customers/list-customers-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { getPaymentGrade } from '../../dtos/customers/customer-full-response.dto';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    findAll(options: {
        filters?: { customerId?: string; status?: string };
        limit?: number;
        offset?: number;
    }): Promise<{ invoices: Invoice[]; total: number }>;
}

@injectable()
export class ListCustomersUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
    ) {}

    /**
     * Получает глобальный список клиентов с пагинацией и сортировкой.
     * @param options - Опции пагинации и сортировки (userId больше не нужен).
     * @returns Объект ListCustomersResponseDto с результатами.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(
        options: FindAllCustomersOptions,
    ): Promise<ListCustomersResponseDto> {
        try {
            const currentDate = new Date();
            
            // Вызываем метод репозитория без userId для фильтрации
            const { customers, total } =
                await this.customerRepository.findAll(options);

            // Получаем рисковость и статистику задолженности для каждого клиента
            const customerDtos = await Promise.all(
                customers.map(async (customer) => {
                    try {
                        // Получаем статистику рисковости
                        const stats = await this.debtWorkRecordRepository.getCustomerStats(customer.id);
                        
                        // Получаем счета клиента для расчёта задолженности и рейтинга
                        const { invoices } = await this.invoiceRepository.findAll({
                            filters: { customerId: customer.id },
                            limit: 10000,
                            offset: 0,
                        });

                        // Вычисляем totalDebt и overdueDebt
                        let totalDebt = 0;
                        let overdueDebt = 0;
                        let paidOnTimeCount = 0;
                        let paidLateCount = 0;
                        let hasCourtCases = false;
                        let hasBadDebt = false;

                        for (const invoice of invoices) {
                            if (invoice.status !== 'PAID') {
                                const outstanding = invoice.outstandingAmount;
                                totalDebt += outstanding;
                                
                                // Вычисляем дни просрочки
                                const dueDate = new Date(invoice.dueDate);
                                const diffMs = currentDate.getTime() - dueDate.getTime();
                                const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                
                                if (daysOverdue > 0) {
                                    overdueDebt += outstanding;
                                }
                                
                                // Проверяем на безнадежный долг (> 3 лет)
                                if (daysOverdue > 1095) {
                                    hasBadDebt = true;
                                }
                                
                                // Проверяем на судебные иски
                                if (invoice.debtWorkStatus === 'TRIAL' || invoice.debtWorkStatus === 'COLLECTION') {
                                    hasCourtCases = true;
                                }
                            } else {
                                // Оплаченный счет - проверяем вовремя ли
                                if (invoice.actualPaymentDate) {
                                    const dueDate = new Date(invoice.dueDate);
                                    const paymentDate = new Date(invoice.actualPaymentDate);
                                    if (paymentDate <= dueDate) {
                                        paidOnTimeCount++;
                                    } else {
                                        paidLateCount++;
                                    }
                                }
                            }
                        }

                        // Вычисляем paymentRating
                        const totalPaid = paidOnTimeCount + paidLateCount;
                        const onTimePaymentRate = totalPaid > 0
                            ? Math.round((paidOnTimeCount / totalPaid) * 100)
                            : 100;

                        const paymentGradeData = getPaymentGrade(
                            onTimePaymentRate,
                            hasCourtCases,
                            hasBadDebt,
                        );

                        return plainToInstance(CustomerResponseDto, {
                            ...customer,
                            riskScore: stats.riskScore,
                            riskLevel: stats.riskLevel,
                            totalDebt: Math.round(totalDebt * 100) / 100,
                            overdueDebt: Math.round(overdueDebt * 100) / 100,
                            paymentRating: paymentGradeData.grade,
                        }, {
                            excludeExtraneousValues: true,
                        });
                    } catch (error) {
                        // Если не удалось получить статистику, возвращаем клиента с базовыми данными
                        console.warn(`Failed to get stats for customer ${customer.id}:`, error);
                        return plainToInstance(CustomerResponseDto, {
                            ...customer,
                            totalDebt: customer.totalDebt || 0,
                            overdueDebt: customer.overdueDebt || 0,
                        }, {
                            excludeExtraneousValues: true,
                        });
                    }
                }),
            );

            return plainToInstance(ListCustomersResponseDto, {
                customers: customerDtos,
                total,
                offset: options.offset ?? 0,
                limit: options.limit ?? 10,
            });
        } catch (error) {
            console.error(`Error in ListCustomersUseCase:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить список клиентов', 500);
        }
    }
}
