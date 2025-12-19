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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerResponseDto = void 0;
// src/application/dtos/customers/customer-response.dto.ts
const class_transformer_1 = require("class-transformer");
const risk_level_enum_1 = require("../../../domain/enums/risk-level.enum");
/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerResponseDto:
 *       type: object
 *       description: Представление данных клиента для ответа API.
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор клиента (обычно ObjectId).
 *           example: "6151f5a0a9a7b1001b1a77a5"
 *         name:
 *           type: string
 *           description: Название или имя клиента.
 *           example: "ООО Ромашка"
 *         unp:
 *           type: string
 *           nullable: true # Указываем, что УНП может отсутствовать
 *           description: УНП клиента (если предоставлен).
 *           example: "7712345678"
 *         contactInfo:
 *           type: string
 *           nullable: true # Контактная информация тоже может отсутствовать
 *           description: Контактная информация клиента (например, email или телефон).
 *           example: "contact@romashka.ru"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания записи клиента.
 *           example: "2023-10-01T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления записи клиента.
 *           example: "2024-01-15T14:30:00.000Z"
 *         riskScore:
 *           type: number
 *           nullable: true
 *           description: Оценка рисковости клиента (0-100). Рассчитывается на основе истории работы с задолженностью.
 *           example: 45
 *         riskLevel:
 *           type: string
 *           nullable: true
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Уровень риска клиента на основе riskScore.
 *           example: "MEDIUM"
 *       required:
 *         - id
 *         - name
 *         - createdAt
 *         - updatedAt
 */
class CustomerResponseDto {
    constructor() {
        /**
         * Уникальный идентификатор клиента.
         * @example "6151f5a0a9a7b1001b1a77a5"
         */
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Название или имя клиента.
         * @example "ООО Ромашка"
         */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * УНП клиента (может отсутствовать).
         * @example "7712345678"
         */
        Object.defineProperty(this, "unp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Контактная информация клиента (может отсутствовать).
         * @example "contact@romashka.ru"
         */
        Object.defineProperty(this, "contactInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Дата и время создания записи клиента.
         */
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Дата и время последнего обновления записи клиента.
         */
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Оценка рисковости клиента (0-100). Рассчитывается на основе истории работы с задолженностью.
         * @example 45
         */
        Object.defineProperty(this, "riskScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Уровень риска клиента на основе riskScore.
         * @example "MEDIUM"
         */
        Object.defineProperty(this, "riskLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Общая задолженность клиента.
         * @example 150000.00
         */
        Object.defineProperty(this, "totalDebt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Просроченная задолженность клиента.
         * @example 50000.00
         */
        Object.defineProperty(this, "overdueDebt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Рейтинг платежеспособности (A-F).
         * @example "B"
         */
        Object.defineProperty(this, "paymentRating", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Поле userId не включается в ответ API, поэтому для него нет @Expose
    }
}
exports.CustomerResponseDto = CustomerResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "unp", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "contactInfo", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], CustomerResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], CustomerResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], CustomerResponseDto.prototype, "riskScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "riskLevel", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], CustomerResponseDto.prototype, "totalDebt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], CustomerResponseDto.prototype, "overdueDebt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CustomerResponseDto.prototype, "paymentRating", void 0);
//# sourceMappingURL=customer-response.dto.js.map