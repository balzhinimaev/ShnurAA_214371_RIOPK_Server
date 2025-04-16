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
exports.ListCustomersUseCase = void 0;
// src/application/use-cases/customers/list-customers.use-case.ts
const tsyringe_1 = require("tsyringe");
const ICustomerRepository_1 = require("../../../domain/repositories/ICustomerRepository");
const customer_response_dto_1 = require("../../dtos/customers/customer-response.dto");
const list_customers_response_dto_1 = require("../../dtos/customers/list-customers-response.dto");
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError");
let ListCustomersUseCase = class ListCustomersUseCase {
    constructor(customerRepository) {
        Object.defineProperty(this, "customerRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: customerRepository
        });
    }
    /**
     * Получает глобальный список клиентов с пагинацией и сортировкой.
     * @param options - Опции пагинации и сортировки (userId больше не нужен).
     * @returns Объект ListCustomersResponseDto с результатами.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(options) {
        // --- ИЗМЕНЕНО: Убрана проверка userId ---
        // if (!options?.userId) { ... }
        try {
            // Вызываем метод репозитория без userId для фильтрации
            const { customers, total } = await this.customerRepository.findAll(options);
            const customerDtos = customers.map((customer) => (0, class_transformer_1.plainToInstance)(customer_response_dto_1.CustomerResponseDto, customer, {
                excludeExtraneousValues: true,
            }));
            return (0, class_transformer_1.plainToInstance)(list_customers_response_dto_1.ListCustomersResponseDto, {
                customers: customerDtos,
                total,
                offset: options.offset ?? 0,
                limit: options.limit ?? 10,
            });
        }
        catch (error) {
            console.error(`Error in ListCustomersUseCase:`, error);
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError('Не удалось получить список клиентов', 500);
        }
    }
};
exports.ListCustomersUseCase = ListCustomersUseCase;
exports.ListCustomersUseCase = ListCustomersUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(ICustomerRepository_1.CustomerRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], ListCustomersUseCase);
//# sourceMappingURL=list-customers.use-case.js.map