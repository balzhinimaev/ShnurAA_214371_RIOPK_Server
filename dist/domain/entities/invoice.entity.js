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
        Object.defineProperty(this, "issueDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dueDate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "totalAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "paidAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
        this.totalAmount = props.totalAmount;
        this.paidAmount = props.paidAmount;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    get outstandingAmount() {
        return this.totalAmount - this.paidAmount;
    }
    isOverdue(currentDate = new Date()) {
        return this.status !== 'PAID' && this.dueDate < currentDate;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=invoice.entity.js.map