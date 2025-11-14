"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
class Invoice {
    constructor(props) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "invoiceNumber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "customerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "customer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Опционально, если делаем populate
        // Базовые даты
        Object.defineProperty(this, "issueDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Дата выставления счета
        Object.defineProperty(this, "dueDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Срок оплаты
        // Новые поля: период оказания услуги
        Object.defineProperty(this, "serviceStartDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Дата начала услуги
        Object.defineProperty(this, "serviceEndDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Дата окончания услуги
        // Суммы
        Object.defineProperty(this, "totalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Сумма к оплате
        Object.defineProperty(this, "paidAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Сумма оплачено
        // Даты и сроки
        Object.defineProperty(this, "paymentTermDays", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Срок оплаты в днях (обычно 30)
        Object.defineProperty(this, "actualPaymentDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Дата фактической оплаты
        // Статусы
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Базовый статус (OPEN, PAID, OVERDUE)
        Object.defineProperty(this, "debtWorkStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Статус работы с долгом
        // Специфика бизнеса
        Object.defineProperty(this, "serviceType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Тип услуги
        Object.defineProperty(this, "manager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Менеджер, ответственный за клиента
        Object.defineProperty(this, "contractNumber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Номер договора
        // История работы с долгом
        Object.defineProperty(this, "lastContactDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Дата последнего контакта
        Object.defineProperty(this, "contactResult", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Результат последнего контакта
        Object.defineProperty(this, "notes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Примечания
        // Метаданные
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
        this.contractNumber = props.contractNumber;
        this.lastContactDate = props.lastContactDate;
        this.contactResult = props.contactResult;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    // Расчетные методы
    get outstandingAmount() {
        return this.totalAmount - this.paidAmount;
    }
    // Метод для сериализации в JSON (чтобы outstandingAmount и customer включались)
    toJSON() {
        return {
            id: this.id,
            invoiceNumber: this.invoiceNumber,
            customerId: this.customerId,
            customer: this.customer ? {
                id: this.customer.id,
                name: this.customer.name,
                unp: this.customer.unp,
                contactInfo: this.customer.contactInfo,
                createdAt: this.customer.createdAt,
                updatedAt: this.customer.updatedAt,
            } : undefined,
            issueDate: this.issueDate,
            dueDate: this.dueDate,
            serviceStartDate: this.serviceStartDate,
            serviceEndDate: this.serviceEndDate,
            totalAmount: this.totalAmount,
            paidAmount: this.paidAmount,
            outstandingAmount: this.outstandingAmount, // Включаем вычисляемое поле
            paymentTermDays: this.paymentTermDays,
            actualPaymentDate: this.actualPaymentDate,
            status: this.status,
            debtWorkStatus: this.debtWorkStatus,
            serviceType: this.serviceType,
            manager: this.manager,
            contractNumber: this.contractNumber,
            lastContactDate: this.lastContactDate,
            contactResult: this.contactResult,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    isOverdue(currentDate = new Date()) {
        return this.status !== 'PAID' && this.dueDate < currentDate;
    }
    // Количество дней просрочки (положительное число = просрочено)
    getDaysOverdue(currentDate = new Date()) {
        if (!this.isOverdue(currentDate))
            return 0;
        const diffMs = currentDate.getTime() - this.dueDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    // Автоматический расчет статуса работы с долгом на основе просрочки
    calculateDebtWorkStatus(currentDate = new Date()) {
        if (this.status === 'PAID')
            return 'CLOSED';
        if (!this.isOverdue(currentDate))
            return 'IN_TIME';
        const daysOverdue = this.getDaysOverdue(currentDate);
        if (daysOverdue >= 1 && daysOverdue <= 30)
            return 'CALL';
        if (daysOverdue >= 31 && daysOverdue <= 60)
            return 'CLAIM';
        if (daysOverdue >= 61 && daysOverdue <= 90)
            return 'PRE_TRIAL';
        if (daysOverdue >= 91 && daysOverdue <= 180)
            return 'TRIAL';
        if (daysOverdue > 180)
            return 'COLLECTION';
        return 'IN_TIME';
    }
    // Частичная оплата
    applyPayment(amount, paymentDate = new Date()) {
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
exports.Invoice = Invoice;
//# sourceMappingURL=invoice.entity.js.map