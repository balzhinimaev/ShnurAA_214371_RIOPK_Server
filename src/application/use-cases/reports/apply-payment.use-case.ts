// src/application/use-cases/reports/apply-payment.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { AppError } from '../../errors/AppError';

export interface ApplyPaymentDto {
    invoiceId: string;
    amount: number;
    paymentDate?: Date;
}

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    updatePayment(
        id: string,
        paidAmount: number,
        actualPaymentDate?: Date,
    ): Promise<Invoice | null>;
}

@injectable()
export class ApplyPaymentUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(data: ApplyPaymentDto): Promise<Invoice> {
        const { invoiceId, amount, paymentDate } = data;

        // Валидация суммы
        if (amount <= 0) {
            throw new AppError('Сумма оплаты должна быть положительной', 400);
        }

        // Получаем текущий счет
        const invoice = await this.invoiceRepository.findById(invoiceId);
        if (!invoice) {
            throw new AppError('Счет не найден', 404);
        }

        // Проверяем, не превышает ли оплата задолженность
        const newPaidAmount = invoice.paidAmount + amount;
        if (newPaidAmount > invoice.totalAmount) {
            throw new AppError(
                `Сумма оплаты (${amount}) превышает остаток задолженности (${invoice.outstandingAmount})`,
                400,
            );
        }

        // Применяем оплату
        const actualPaymentDate = paymentDate || new Date();
        const updatedInvoice = await this.invoiceRepository.updatePayment(
            invoiceId,
            newPaidAmount,
            actualPaymentDate,
        );

        if (!updatedInvoice) {
            throw new AppError('Ошибка при применении оплаты', 500);
        }

        return updatedInvoice;
    }
}

