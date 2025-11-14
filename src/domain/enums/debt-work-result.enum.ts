// src/domain/enums/debt-work-result.enum.ts

/**
 * Результат действия по работе с задолженностью
 */
export enum DebtWorkResult {
    CONTACTED = 'CONTACTED',          // Связались с клиентом
    NO_CONTACT = 'NO_CONTACT',        // Не удалось связаться
    PROMISED_PAY = 'PROMISED_PAY',    // Обещали оплатить
    REFUSED = 'REFUSED',              // Отказались платить
    PARTIAL_PAY = 'PARTIAL_PAY',      // Частичная оплата
    FULL_PAY = 'FULL_PAY',            // Полная оплата
    IN_PROGRESS = 'IN_PROGRESS',      // В процессе
    COMPLETED = 'COMPLETED',          // Завершено
    CANCELLED = 'CANCELLED'           // Отменено
}

