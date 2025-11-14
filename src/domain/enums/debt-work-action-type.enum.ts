// src/domain/enums/debt-work-action-type.enum.ts

/**
 * Тип действия по работе с задолженностью
 */
export enum DebtWorkActionType {
    CALL = 'CALL',                    // Звонок клиенту
    EMAIL = 'EMAIL',                  // Отправка email
    SMS = 'SMS',                      // Отправка SMS
    LETTER = 'LETTER',                // Отправка письма
    CLAIM = 'CLAIM',                  // Претензия
    COURT_CLAIM = 'COURT_CLAIM',      // Заявление в суд
    COURT_DECISION = 'COURT_DECISION', // Решение суда
    EXECUTION = 'EXECUTION',          // Исполнительное производство
    SETTLEMENT = 'SETTLEMENT',        // Досудебное урегулирование
    PAYMENT_PLAN = 'PAYMENT_PLAN',    // График погашения
    OTHER = 'OTHER'                   // Прочее
}

