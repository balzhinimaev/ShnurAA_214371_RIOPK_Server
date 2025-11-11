// src/application/dtos/reports/customers-overdue-filters.dto.ts

/**
 * Категории старения задолженности (aging buckets)
 */
export enum AgingBucket {
    CURRENT = 'CURRENT', // 0 дней (без просрочки)
    DAYS_1_30 = '1_30', // 1-30 дней просрочки
    DAYS_31_60 = '31_60', // 31-60 дней просрочки
    DAYS_61_90 = '61_90', // 61-90 дней просрочки
    DAYS_91_PLUS = '91_PLUS', // 91+ дней просрочки
}

/**
 * Фильтры для получения клиентов с просрочкой
 */
export interface CustomersOverdueFiltersDto {
    /**
     * Фильтр по категории старения (aging bucket)
     * Можно указать одну категорию для точной фильтрации
     */
    agingBucket?: AgingBucket;

    /**
     * Минимальное количество дней просрочки (для гибкой фильтрации)
     * Если указано, имеет приоритет над agingBucket
     */
    minDaysOverdue?: number;

    /**
     * Максимальное количество дней просрочки (для гибкой фильтрации)
     * Если указано, имеет приоритет над agingBucket
     */
    maxDaysOverdue?: number;

    /**
     * Минимальная сумма просроченной задолженности
     */
    minOverdueAmount?: number;

    /**
     * Включать ли клиентов без просрочки (CURRENT)
     * По умолчанию false
     */
    includeCurrent?: boolean;
}

/**
 * Опции для получения списка клиентов с просрочкой
 */
export interface GetCustomersOverdueOptions {
    filters?: CustomersOverdueFiltersDto;
    limit?: number;
    offset?: number;
    sortBy?: 'overdueAmount' | 'oldestDebtDays' | 'totalDebt' | 'customerName';
    sortOrder?: 'asc' | 'desc';
}

/**
 * DTO для клиента с информацией о просрочке
 */
export interface CustomerOverdueDto {
    customerId: string;
    customerName: string;
    customerUnp?: string;
    totalDebt: number; // Общая задолженность
    overdueDebt: number; // Просроченная задолженность
    currentDebt: number; // Задолженность в срок
    invoiceCount: number; // Общее количество счетов
    overdueInvoiceCount: number; // Количество просроченных счетов
    oldestDebtDays: number; // Количество дней самой старой просрочки
    agingBucket: AgingBucket; // Категория по самой старой просрочке
    
    // Детализация по aging buckets
    agingBreakdown?: {
        current: number; // Сумма без просрочки
        days_1_30: number; // Сумма 1-30 дней
        days_31_60: number; // Сумма 31-60 дней
        days_61_90: number; // Сумма 61-90 дней
        days_91_plus: number; // Сумма 91+ дней
    };
}

/**
 * Результат получения списка клиентов с просрочкой
 */
export interface GetCustomersOverdueResult {
    customers: CustomerOverdueDto[];
    total: number;
    limit: number;
    offset: number;
    summary?: {
        totalOverdueAmount: number;
        totalCustomers: number;
        averageDaysOverdue: number;
    };
}

