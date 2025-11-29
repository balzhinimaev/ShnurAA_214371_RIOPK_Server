// src/domain/types/payment.types.ts

/**
 * Интерфейс для информации о платеже
 */
export interface Payment {
    /** Уникальный идентификатор платежа */
    id: string;
    /** Сумма платежа */
    amount: number;
    /** Дата платежа */
    paymentDate: Date;
    /** Способ оплаты (опционально) */
    paymentMethod?: string;
    /** Был ли платеж вовремя */
    isOnTime?: boolean;
    /** Количество дней задержки (если просрочен) */
    daysDelay?: number;
}

/**
 * Статус срока оплаты счета
 */
export type DueStatus = 'FUTURE' | 'TODAY' | 'OVERDUE';

/**
 * Определяет статус срока оплаты
 * @param dueDate - Дата срока оплаты
 * @param currentDate - Текущая дата (по умолчанию - сегодня)
 * @returns Статус срока оплаты
 */
export function getDueStatus(dueDate: Date, currentDate: Date = new Date()): DueStatus {
    // Нормализуем даты к началу дня для корректного сравнения
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    if (dueDay.getTime() === currentDay.getTime()) {
        return 'TODAY';
    }
    if (dueDay.getTime() > currentDay.getTime()) {
        return 'FUTURE';
    }
    return 'OVERDUE';
}

/**
 * Вычисляет количество дней до срока оплаты
 * @param dueDate - Дата срока оплаты
 * @param currentDate - Текущая дата
 * @returns Количество дней (положительное = до срока, отрицательное = просрочка)
 */
export function getDaysUntilDue(dueDate: Date, currentDate: Date = new Date()): number {
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    const diffMs = dueDay.getTime() - currentDay.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

