// src/application/use-cases/reports/get-invoice-details.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import { AppError } from '../../errors/AppError';
import { InvoiceResponseDto, PaymentDto } from '../../dtos/reports/invoice-response.dto';
import { getOverdueCategory, getRecommendation } from '../../../domain/enums/overdue-category.enum';
import { getDueStatus, getDaysUntilDue, Payment } from '../../../domain/types/payment.types';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]>;
}

@injectable()
export class GetInvoiceDetailsUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(invoiceId: string): Promise<InvoiceResponseDto> {
        const currentDate = new Date();

        // Получаем счет
        const invoice = await this.invoiceRepository.findById(invoiceId);
        if (!invoice) {
            throw new AppError('Счет не найден', 404);
        }

        // Получаем платежи по счету
        const payments = await this.invoiceRepository.getPaymentsByInvoiceId(invoiceId);

        // Вычисляем дни просрочки
        const dueDate = new Date(invoice.dueDate);
        const diffMs = currentDate.getTime() - dueDate.getTime();
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Вычисляем дни до срока
        const daysUntilDue = getDaysUntilDue(dueDate, currentDate);
        
        // Определяем статус срока
        const dueStatus = getDueStatus(dueDate, currentDate);
        
        // Определяем категорию просрочки и рекомендацию
        const overdueCategory = getOverdueCategory(daysOverdue);
        const recommendation = getRecommendation(overdueCategory);

        // Определяем дату последнего платежа
        const lastPaymentDate = payments.length > 0
            ? payments.reduce((latest, p) => {
                  const pDate = new Date(p.paymentDate);
                  return pDate > latest ? pDate : latest;
              }, new Date(0))
            : invoice.actualPaymentDate;

        // Формируем DTO
        const invoiceJson = invoice.toJSON();
        
        return {
            ...invoiceJson,
            daysOverdue,
            daysUntilDue,
            dueStatus,
            overdueCategory,
            recommendation,
            payments: payments.map(p => ({
                id: p.id,
                amount: p.amount,
                paymentDate: p.paymentDate,
                paymentMethod: p.paymentMethod,
                isOnTime: p.isOnTime,
                daysDelay: p.daysDelay,
            })) as PaymentDto[],
            lastPaymentDate: lastPaymentDate || undefined,
        } as InvoiceResponseDto;
    }
}

