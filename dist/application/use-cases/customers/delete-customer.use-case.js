"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCustomerUseCase = void 0;
// src/application/use-cases/customers/delete-customer.use-case.ts
const tsyringe_1 = require("tsyringe");
const ICustomerRepository_1 = require("../../../domain/repositories/ICustomerRepository");
const AppError_1 = require("../../errors/AppError");
// import { IInvoiceRepository, InvoiceRepositoryToken } from '../../../domain/repositories/IInvoiceRepository'; // Опционально для проверки счетов
let DeleteCustomerUseCase = class DeleteCustomerUseCase {
    constructor(customerRepository) {
        Object.defineProperty(this, "customerRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: customerRepository
        });
    }
    /**
     * Удаляет глобального клиента.
     * Проверяет, имеет ли пользователь права на удаление (только ADMIN).
     * @param customerId - ID удаляемого клиента.
     * @param actingUserRoles - Роли пользователя, выполняющего действие.
     * @returns true в случае успеха.
     * @throws {AppError} Если нет прав (403), клиент не найден (404), нельзя удалить (400), или ошибка БД (500).
     */
    async execute(customerId, actingUserRoles) {
        // --- ДОБАВЛЕНО: Проверка прав ---
        if (!actingUserRoles?.includes('ADMIN')) {
            throw new AppError_1.AppError('Доступ запрещен: только администратор может удалять клиентов', 403);
        }
        // --- Опционально: Проверка связанных данных (например, неоплаченных счетов) ---
        // const openInvoices = await this.invoiceRepository.findOpenByCustomerId(customerId);
        // if (openInvoices && openInvoices.length > 0) {
        //     throw new AppError('Нельзя удалить клиента с активными счетами', 400);
        // }
        try {
            // --- ИЗМЕНЕНО: Вызываем delete без userId ---
            const deleted = await this.customerRepository.delete(customerId);
            if (!deleted) {
                // Репозиторий вернет false, если ID не найден
                throw new AppError_1.AppError('Клиент для удаления не найден', 404);
            }
            return true;
        }
        catch (error) {
            console.error(`Error in DeleteCustomerUseCase for ID ${customerId}:`, error);
            if (error instanceof AppError_1.AppError) {
                throw error; // Пробрасываем AppError (403, 404, 400)
            }
            throw new AppError_1.AppError('Не удалось удалить клиента', 500);
        }
    }
};
exports.DeleteCustomerUseCase = DeleteCustomerUseCase;
exports.DeleteCustomerUseCase = DeleteCustomerUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(ICustomerRepository_1.CustomerRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], DeleteCustomerUseCase);
//# sourceMappingURL=delete-customer.use-case.js.map