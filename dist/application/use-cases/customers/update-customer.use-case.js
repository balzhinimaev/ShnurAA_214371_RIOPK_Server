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
exports.UpdateCustomerUseCase = void 0;
// src/application/use-cases/customers/update-customer.use-case.ts
const tsyringe_1 = require("tsyringe");
const ICustomerRepository_1 = require("../../../domain/repositories/ICustomerRepository");
const customer_response_dto_1 = require("../../dtos/customers/customer-response.dto");
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError");
let UpdateCustomerUseCase = class UpdateCustomerUseCase {
    constructor(customerRepository) {
        Object.defineProperty(this, "customerRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: customerRepository
        });
    }
    /**
     * Обновляет данные глобального клиента.
     * Проверяет, имеет ли пользователь права на обновление (ADMIN или ANALYST).
     * @param customerId - ID обновляемого клиента.
     * @param actingUserRoles - Роли пользователя, выполняющего действие.
     * @param data - Данные для обновления.
     * @returns Обновленные данные клиента в виде CustomerResponseDto.
     * @throws {AppError} Если нет прав (403), клиент не найден (404), или ошибка БД (500).
     */
    async execute(customerId, actingUserRoles, // Принимаем роли для проверки
    data) {
        // --- ДОБАВЛЕНО: Проверка прав ---
        const allowedRoles = ['ADMIN', 'ANALYST'];
        if (!actingUserRoles?.some((role) => allowedRoles.includes(role))) {
            throw new AppError_1.AppError('Доступ запрещен: недостаточно прав для обновления клиента', 403);
        }
        try {
            // --- ИЗМЕНЕНО: Вызываем update без userId ---
            const updatedCustomer = await this.customerRepository.update(customerId, data);
            if (!updatedCustomer) {
                // Репозиторий вернет null, если ID не найден
                throw new AppError_1.AppError('Клиент для обновления не найден', 404);
            }
            return (0, class_transformer_1.plainToInstance)(customer_response_dto_1.CustomerResponseDto, updatedCustomer, {
                excludeExtraneousValues: true,
            });
        }
        catch (error) {
            console.error(`Error in UpdateCustomerUseCase for ID ${customerId}:`, error);
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError('Не удалось обновить клиента', 500);
        }
    }
};
exports.UpdateCustomerUseCase = UpdateCustomerUseCase;
exports.UpdateCustomerUseCase = UpdateCustomerUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(ICustomerRepository_1.CustomerRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], UpdateCustomerUseCase);
//# sourceMappingURL=update-customer.use-case.js.map