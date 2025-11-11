// src/application/use-cases/reports/get-customers-overdue.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    GetCustomersOverdueOptions,
    GetCustomersOverdueResult,
} from '../../dtos/reports/customers-overdue-filters.dto';

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getCustomersWithOverdue(
        options: GetCustomersOverdueOptions,
        asOfDate: Date,
    ): Promise<GetCustomersOverdueResult>;
}

@injectable()
export class GetCustomersOverdueUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(
        options: GetCustomersOverdueOptions = {},
    ): Promise<GetCustomersOverdueResult> {
        const asOfDate = new Date();

        // Устанавливаем значения по умолчанию
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const sortBy = options.sortBy || 'overdueAmount';
        const sortOrder = options.sortOrder || 'desc';

        const result = await this.invoiceRepository.getCustomersWithOverdue(
            {
                filters: options.filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            },
            asOfDate,
        );

        return result;
    }
}

