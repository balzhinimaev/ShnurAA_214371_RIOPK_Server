// src/application/use-cases/reports/list-invoices.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    Invoice,
    InvoiceStatus,
    DebtWorkStatus,
    ServiceType,
} from '../../../domain/entities/invoice.entity';

export interface ListInvoicesFilters {
    status?: InvoiceStatus; // Фильтр по статусу
    debtWorkStatus?: DebtWorkStatus; // Фильтр по статусу работы с долгом
    serviceType?: ServiceType; // Фильтр по типу услуги
    manager?: string; // Фильтр по менеджеру
    customerId?: string; // Фильтр по клиенту
    isOverdue?: boolean; // Только просроченные
    minAmount?: number; // Минимальная сумма задолженности
    maxAmount?: number; // Максимальная сумма задолженности
    dueDateFrom?: Date; // Срок оплаты от
    dueDateTo?: Date; // Срок оплаты до
    minDaysOverdue?: number; // Минимальное количество дней просрочки
    maxDaysOverdue?: number; // Максимальное количество дней просрочки
}

export interface ListInvoicesOptions {
    filters?: ListInvoicesFilters;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ListInvoicesResult {
    invoices: Invoice[];
    total: number;
    limit: number;
    offset: number;
}

// Расширенный интерфейс репозитория
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    findAll(options: ListInvoicesOptions): Promise<ListInvoicesResult>;
}

@injectable()
export class ListInvoicesUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(options: ListInvoicesOptions): Promise<ListInvoicesResult> {
        // Устанавливаем значения по умолчанию
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const sortBy = options.sortBy || 'dueDate';
        const sortOrder = options.sortOrder || 'asc';

        const result = await this.invoiceRepository.findAll({
            filters: options.filters,
            limit,
            offset,
            sortBy,
            sortOrder,
        });

        return result;
    }
}

