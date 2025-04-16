"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
// src/domain/entities/customer.entity.ts
class Customer {
    constructor(props) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "contactInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "totalDebt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Эти поля не хранятся в БД, а рассчитываются
        Object.defineProperty(this, "overdueDebt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Эти поля не хранятся в БД, а рассчитываются
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
        this.name = props.name;
        this.inn = props.inn;
        this.contactInfo = props.contactInfo;
        this.totalDebt = props.totalDebt;
        this.overdueDebt = props.overdueDebt;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
exports.Customer = Customer;
//# sourceMappingURL=customer.entity.js.map