// src/domain/entities/invoice.entity.ts
import { Customer } from './customer.entity';

export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE';

// Статус работы с задолженностью (жизненный цикл взыскания)
export type DebtWorkStatus =
    | 'IN_TIME' // В срок - срок оплаты не наступил
    | 'CALL' // Прозвон - просрочка 1-30 дней
    | 'CLAIM' // Претензия - просрочка 31-60 дней
    | 'PRE_TRIAL' // Подготовка к суду - просрочка 61-90 дней
    | 'TRIAL' // Суд - просрочка 90-180 дней
    | 'COLLECTION' // Взыскание - в процессе судебного взыскания
    | 'WRITE_OFF' // Списание - безнадежный долг
    | 'CLOSED'; // Закрыт - долг оплачен

// Типы услуг (специфика бизнеса)
export type ServiceType =
    | 'PKT_SUPPORT' // Сопровождение ПКТ
    | 'KKT_INSTALLATION' // Установка ККТ
    | 'KKT_SERVICE' // Обслуживание ККТ
    | 'VENDING_SERVICE' // Обслуживание торговых автоматов
    | 'VENDING_INSTALLATION' // Установка торгового автомата
    | 'OTHER'; // Прочее

export class Invoice {
    public readonly id: string;
    public invoiceNumber: string;
    public customerId: string;
    public customer?: Customer; // Опционально, если делаем populate
    
    // Базовые даты
    public issueDate: Date; // Дата выставления счета
    public dueDate: Date; // Срок оплаты
    
    // Новые поля: период оказания услуги
    public serviceStartDate?: Date; // Дата начала услуги
    public serviceEndDate?: Date; // Дата окончания услуги
    
    // Суммы
    public totalAmount: number; // Сумма к оплате
    public paidAmount: number; // Сумма оплачено
    
    // Даты и сроки
    public paymentTermDays: number; // Срок оплаты в днях (обычно 30)
    public actualPaymentDate?: Date; // Дата фактической оплаты
    
    // Статусы
    public status: InvoiceStatus; // Базовый статус (OPEN, PAID, OVERDUE)
    public debtWorkStatus?: DebtWorkStatus; // Статус работы с долгом
    
    // Специфика бизнеса
    public serviceType?: ServiceType; // Тип услуги
    public manager?: string; // Менеджер, ответственный за клиента
    
    // История работы с долгом
    public lastContactDate?: Date; // Дата последнего контакта
    public contactResult?: string; // Результат последнего контакта
    public notes?: string; // Примечания
    
    // Метаданные
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: {
        id: string;
        invoiceNumber: string;
        customerId: string;
        customer?: Customer;
        issueDate: Date;
        dueDate: Date;
        serviceStartDate?: Date;
        serviceEndDate?: Date;
        totalAmount: number;
        paidAmount: number;
        paymentTermDays: number;
        actualPaymentDate?: Date;
        status: InvoiceStatus;
        debtWorkStatus?: DebtWorkStatus;
        serviceType?: ServiceType;
        manager?: string;
        lastContactDate?: Date;
        contactResult?: string;
        notes?: string;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.invoiceNumber = props.invoiceNumber;
        this.customerId = props.customerId;
        this.customer = props.customer;
        this.issueDate = props.issueDate;
        this.dueDate = props.dueDate;
        this.serviceStartDate = props.serviceStartDate;
        this.serviceEndDate = props.serviceEndDate;
        this.totalAmount = props.totalAmount;
        this.paidAmount = props.paidAmount;
        this.paymentTermDays = props.paymentTermDays;
        this.actualPaymentDate = props.actualPaymentDate;
        this.status = props.status;
        this.debtWorkStatus = props.debtWorkStatus;
        this.serviceType = props.serviceType;
        this.manager = props.manager;
        this.lastContactDate = props.lastContactDate;
        this.contactResult = props.contactResult;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    // Расчетные методы
    get outstandingAmount(): number {
        return this.totalAmount - this.paidAmount;
    }

    isOverdue(currentDate: Date = new Date()): boolean {
        return this.status !== 'PAID' && this.dueDate < currentDate;
    }
    
    // Количество дней просрочки (положительное число = просрочено)
    getDaysOverdue(currentDate: Date = new Date()): number {
        if (!this.isOverdue(currentDate)) return 0;
        const diffMs = currentDate.getTime() - this.dueDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    
    // Автоматический расчет статуса работы с долгом на основе просрочки
    calculateDebtWorkStatus(currentDate: Date = new Date()): DebtWorkStatus {
        if (this.status === 'PAID') return 'CLOSED';
        
        if (!this.isOverdue(currentDate)) return 'IN_TIME';
        
        const daysOverdue = this.getDaysOverdue(currentDate);
        
        if (daysOverdue >= 1 && daysOverdue <= 30) return 'CALL';
        if (daysOverdue >= 31 && daysOverdue <= 60) return 'CLAIM';
        if (daysOverdue >= 61 && daysOverdue <= 90) return 'PRE_TRIAL';
        if (daysOverdue >= 91 && daysOverdue <= 180) return 'TRIAL';
        if (daysOverdue > 180) return 'COLLECTION';
        
        return 'IN_TIME';
    }
    
    // Частичная оплата
    applyPayment(amount: number, paymentDate: Date = new Date()): void {
        if (amount <= 0) {
            throw new Error('Сумма оплаты должна быть положительной');
        }
        
        if (this.paidAmount + amount > this.totalAmount) {
            throw new Error('Сумма оплаты превышает задолженность');
        }
        
        this.paidAmount += amount;
        this.actualPaymentDate = paymentDate;
        
        if (this.paidAmount >= this.totalAmount) {
            this.status = 'PAID';
            this.debtWorkStatus = 'CLOSED';
        }
    }
}
