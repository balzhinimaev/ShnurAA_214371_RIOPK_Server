// src/domain/entities/invoice.entity.ts
import { Customer } from './customer.entity';

export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE';

export class Invoice {
    public readonly id: string;
    public invoiceNumber: string;
    public customerId: string;
    public customer?: Customer; // Опционально, если делаем populate
    public issueDate: Date;
    public dueDate: Date;
    public totalAmount: number;
    public paidAmount: number;
    public status: InvoiceStatus;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: {
        id: string;
        invoiceNumber: string;
        customerId: string;
        customer?: Customer;
        issueDate: Date;
        dueDate: Date;
        totalAmount: number;
        paidAmount: number;
        status: InvoiceStatus;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.invoiceNumber = props.invoiceNumber;
        this.customerId = props.customerId;
        this.customer = props.customer;
        this.issueDate = props.issueDate;
        this.dueDate = props.dueDate;
        this.totalAmount = props.totalAmount;
        this.paidAmount = props.paidAmount;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    get outstandingAmount(): number {
        return this.totalAmount - this.paidAmount;
    }

    isOverdue(currentDate: Date = new Date()): boolean {
        return this.status !== 'PAID' && this.dueDate < currentDate;
    }
}
