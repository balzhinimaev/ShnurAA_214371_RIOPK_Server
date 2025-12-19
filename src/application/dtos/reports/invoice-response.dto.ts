// src/application/dtos/reports/invoice-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { OverdueCategory } from '../../../domain/enums/overdue-category.enum';
import { DueStatus } from '../../../domain/types/payment.types';

/**
 * DTO для информации о платеже
 */
export class PaymentDto {
    @Expose()
    id!: string;

    @Expose()
    amount!: number;

    @Expose()
    paymentDate!: Date;

    @Expose()
    paymentMethod?: string;

    @Expose()
    isOnTime?: boolean;

    @Expose()
    daysDelay?: number;
}

/**
 * DTO для информации о клиенте внутри Invoice
 */
export class InvoiceCustomerDto {
    @Expose()
    id!: string;

    @Expose()
    name!: string;

    @Expose()
    unp?: string;

    @Expose()
    contactInfo?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     InvoiceResponseDto:
 *       type: object
 *       description: Расширенное представление данных счета с категоризацией просрочек
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор счета
 *         invoiceNumber:
 *           type: string
 *           description: Номер счета
 *         customerId:
 *           type: string
 *           description: ID клиента
 *         customer:
 *           $ref: '#/components/schemas/InvoiceCustomerDto'
 *         issueDate:
 *           type: string
 *           format: date-time
 *           description: Дата выставления счета
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Срок оплаты
 *         totalAmount:
 *           type: number
 *           description: Сумма к оплате
 *         paidAmount:
 *           type: number
 *           description: Оплаченная сумма
 *         outstandingAmount:
 *           type: number
 *           description: Остаток задолженности
 *         status:
 *           type: string
 *           enum: [OPEN, PAID, OVERDUE]
 *           description: Статус счета
 *         daysOverdue:
 *           type: integer
 *           description: Количество дней просрочки (отрицательное = до срока)
 *         daysUntilDue:
 *           type: integer
 *           description: Дней до срока оплаты (отрицательное = просрочка)
 *         dueStatus:
 *           type: string
 *           enum: [FUTURE, TODAY, OVERDUE]
 *           description: Статус срока
 *         overdueCategory:
 *           type: string
 *           enum: [NOT_DUE, NOTIFY, CLAIM, COURT, BAD_DEBT]
 *           description: Категория просрочки
 *         recommendation:
 *           type: string
 *           description: Рекомендация по работе с задолженностью
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PaymentDto'
 *           description: История платежей по счету
 *         lastPaymentDate:
 *           type: string
 *           format: date-time
 *           description: Дата последнего платежа
 *         actualPaymentDate:
 *           type: string
 *           format: date-time
 *           description: Дата фактической оплаты
 */
export class InvoiceResponseDto {
    @Expose()
    id!: string;

    @Expose()
    invoiceNumber!: string;

    @Expose()
    customerId!: string;

    @Expose()
    @Type(() => InvoiceCustomerDto)
    customer?: InvoiceCustomerDto;

    @Expose()
    issueDate!: Date;

    @Expose()
    dueDate!: Date;

    @Expose()
    serviceStartDate?: Date;

    @Expose()
    serviceEndDate?: Date;

    @Expose()
    totalAmount!: number;

    @Expose()
    paidAmount!: number;

    @Expose()
    outstandingAmount!: number;

    @Expose()
    paymentTermDays!: number;

    @Expose()
    actualPaymentDate?: Date;

    @Expose()
    status!: string;

    @Expose()
    debtWorkStatus?: string;

    @Expose()
    serviceType?: string;

    @Expose()
    manager?: string;

    @Expose()
    contractNumber?: string;

    @Expose()
    lastContactDate?: Date;

    @Expose()
    contactResult?: string;

    @Expose()
    notes?: string;

    @Expose()
    createdAt!: Date;

    @Expose()
    updatedAt!: Date;

    // === Новые поля согласно требованиям ===

    /** Количество дней просрочки (отрицательное = до срока) */
    @Expose()
    daysOverdue!: number;

    /** Дней до срока оплаты (отрицательное = просрочка) */
    @Expose()
    daysUntilDue!: number;

    /** Статус срока оплаты */
    @Expose()
    dueStatus!: DueStatus;

    /** Категория просрочки */
    @Expose()
    overdueCategory!: OverdueCategory;

    /** Рекомендация по работе с задолженностью */
    @Expose()
    recommendation!: string;

    /** История платежей по счету */
    @Expose()
    @Type(() => PaymentDto)
    payments!: PaymentDto[];

    /** Дата последнего платежа */
    @Expose()
    lastPaymentDate?: Date;
}

/**
 * Результат списка счетов
 */
export class ListInvoicesResponseDto {
    @Expose()
    @Type(() => InvoiceResponseDto)
    invoices!: InvoiceResponseDto[];

    @Expose()
    total!: number;

    @Expose()
    limit!: number;

    @Expose()
    offset!: number;
}

