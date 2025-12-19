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
const IInvoiceRepository_1 = require("../../../domain/repositories/IInvoiceRepository");
const IDebtWorkRecordRepository_1 = require("../../../domain/repositories/IDebtWorkRecordRepository");
const customer_response_dto_1 = require("../../dtos/customers/customer-response.dto");
const list_customers_response_dto_1 = require("../../dtos/customers/list-customers-response.dto");
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError");
const customer_full_response_dto_1 = require("../../dtos/customers/customer-full-response.dto");
let ListCustomersUseCase = class ListCustomersUseCase {
    constructor(customerRepository, invoiceRepository, debtWorkRecordRepository) {
        Object.defineProperty(this, "customerRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: customerRepository
        });
        Object.defineProperty(this, "invoiceRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: invoiceRepository
        });
        Object.defineProperty(this, "debtWorkRecordRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: debtWorkRecordRepository
        });
    }
    /**
     * Получает глобальный список клиентов с пагинацией и сортировкой.
     * @param options - Опции пагинации и сортировки (userId больше не нужен).
     * @returns Объект ListCustomersResponseDto с результатами.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(options) {
        try {
            const currentDate = new Date();
            // Вызываем метод репозитория без userId для фильтрации
            const { customers, total } = await this.customerRepository.findAll(options);
            // Получаем рисковость и статистику задолженности для каждого клиента
            const customerDtos = await Promise.all(customers.map(async (customer) => {
                try {
                    // Получаем статистику рисковости
                    const stats = await this.debtWorkRecordRepository.getCustomerStats(customer.id);
                    // Получаем счета клиента для расчёта задолженности и рейтинга
                    const { invoices } = await this.invoiceRepository.findAll({
                        filters: { customerId: customer.id },
                        limit: 10000,
                        offset: 0,
                    });
                    // Вычисляем totalDebt и overdueDebt
                    let totalDebt = 0;
                    let overdueDebt = 0;
                    let paidOnTimeCount = 0;
                    let paidLateCount = 0;
                    let hasCourtCases = false;
                    let hasBadDebt = false;
                    for (const invoice of invoices) {
                        if (invoice.status !== 'PAID') {
                            const outstanding = invoice.outstandingAmount;
                            totalDebt += outstanding;
                            // Вычисляем дни просрочки
                            const dueDate = new Date(invoice.dueDate);
                            const diffMs = currentDate.getTime() - dueDate.getTime();
                            const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            if (daysOverdue > 0) {
                                overdueDebt += outstanding;
                            }
                            // Проверяем на безнадежный долг (> 3 лет)
                            if (daysOverdue > 1095) {
                                hasBadDebt = true;
                            }
                            // Проверяем на судебные иски
                            if (invoice.debtWorkStatus === 'TRIAL' || invoice.debtWorkStatus === 'COLLECTION') {
                                hasCourtCases = true;
                            }
                        }
                        else {
                            // Оплаченный счет - проверяем вовремя ли
                            if (invoice.actualPaymentDate) {
                                const dueDate = new Date(invoice.dueDate);
                                const paymentDate = new Date(invoice.actualPaymentDate);
                                if (paymentDate <= dueDate) {
                                    paidOnTimeCount++;
                                }
                                else {
                                    paidLateCount++;
                                }
                            }
                        }
                    }
                    // Вычисляем paymentRating
                    const totalPaid = paidOnTimeCount + paidLateCount;
                    const onTimePaymentRate = totalPaid > 0
                        ? Math.round((paidOnTimeCount / totalPaid) * 100)
                        : 100;
                    const paymentGradeData = (0, customer_full_response_dto_1.getPaymentGrade)(onTimePaymentRate, hasCourtCases, hasBadDebt);
                    return (0, class_transformer_1.plainToInstance)(customer_response_dto_1.CustomerResponseDto, {
                        ...customer,
                        riskScore: stats.riskScore,
                        riskLevel: stats.riskLevel,
                        totalDebt: Math.round(totalDebt * 100) / 100,
                        overdueDebt: Math.round(overdueDebt * 100) / 100,
                        paymentRating: paymentGradeData.grade,
                    }, {
                        excludeExtraneousValues: true,
                    });
                }
                catch (error) {
                    // Если не удалось получить статистику, возвращаем клиента с базовыми данными
                    console.warn(`Failed to get stats for customer ${customer.id}:`, error);
                    return (0, class_transformer_1.plainToInstance)(customer_response_dto_1.CustomerResponseDto, {
                        ...customer,
                        totalDebt: customer.totalDebt || 0,
                        overdueDebt: customer.overdueDebt || 0,
                    }, {
                        excludeExtraneousValues: true,
                    });
                }
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
    __param(1, (0, tsyringe_1.inject)(IInvoiceRepository_1.InvoiceRepositoryToken)),
    __param(2, (0, tsyringe_1.inject)(IDebtWorkRecordRepository_1.DebtWorkRecordRepositoryToken)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ListCustomersUseCase);
//# sourceMappingURL=list-customers.use-case.js.map