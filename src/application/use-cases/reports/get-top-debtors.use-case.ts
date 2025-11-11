// src/application/use-cases/reports/get-top-debtors.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';

export interface TopDebtorDto {
    customerId: string;
    customerName: string;
    customerUnp?: string;
    totalDebt: number;
    overdueDebt: number;
    invoiceCount: number;
    oldestDebtDays: number; // Количество дней самой старой просрочки
}

export interface GetTopDebtorsOptions {
    limit?: number; // По умолчанию 10
    asOfDate?: Date; // Дата расчета (по умолчанию - сегодня)
}

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getTopDebtors(
        limit: number,
        asOfDate: Date,
    ): Promise<TopDebtorDto[]>;
}

@injectable()
export class GetTopDebtorsUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(options: GetTopDebtorsOptions = {}): Promise<TopDebtorDto[]> {
        const limit = options.limit || 10;
        const asOfDate = options.asOfDate || new Date();

        const topDebtors = await this.invoiceRepository.getTopDebtors(
            limit,
            asOfDate,
        );

        return topDebtors;
    }
}

