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
exports.DashboardSummaryDto = void 0;
// src/application/dtos/reports/dashboard-summary.dto.ts
const class_transformer_1 = require("class-transformer");
/**
 * @openapi
 * components:
 *   schemas:
 *     AgingBucketDto:
 *       type: object
 *       properties:
 *         bucket:
 *           type: string
 *           description: Название корзины старения (например, "Current", "1-30", "91+").
 *           example: "31-60"
 *         amount:
 *           type: number
 *           format: float
 *           description: Сумма неоплаченных остатков счетов в данной корзине.
 *           example: 100200.00
 *         count:
 *           type: number
 *           format: integer
 *           description: Количество счетов в данной корзине.
 *           example: 3
 *       required:
 *         - bucket
 *         - amount
 *         - count
 */
class AgingBucketDto {
    constructor() {
        // Класс остается неэкспортируемым, используется через @Type
        Object.defineProperty(this, "bucket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "amount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AgingBucketDto.prototype, "bucket", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AgingBucketDto.prototype, "amount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AgingBucketDto.prototype, "count", void 0);
/**
 * @openapi
 * components:
 *   schemas:
 *     DashboardSummaryDto:
 *       type: object
 *       properties:
 *         totalReceivables:
 *           type: number
 *           format: float
 *           description: Общая сумма текущей дебиторской задолженности (неоплаченные остатки).
 *           example: 1250600.75
 *         overdueReceivables:
 *           type: number
 *           format: float
 *           description: Сумма просроченной дебиторской задолженности.
 *           example: 315200.50
 *         overduePercentage:
 *           type: number
 *           format: float
 *           description: Процент просроченной задолженности от общей.
 *           example: 25.2
 *         currentReceivables:
 *           type: number
 *           format: float
 *           description: Сумма задолженности в срок (не просроченной).
 *           example: 935400.25
 *         averagePaymentDelayDays:
 *           type: number
 *           format: float
 *           description: Средний срок задержки оплаты (в днях).
 *           example: 15.5
 *         totalInvoicesCount:
 *           type: number
 *           format: integer
 *           description: Общее количество неоплаченных счетов.
 *           example: 42
 *         overdueInvoicesCount:
 *           type: number
 *           format: integer
 *           description: Количество просроченных счетов.
 *           example: 18
 *         agingStructure:
 *           type: array
 *           description: Структура дебиторской задолженности по срокам возникновения (старения).
 *           items:
 *             $ref: '#/components/schemas/AgingBucketDto' # Ссылка на схему корзины
 *       required:
 *         - totalReceivables
 *         - overdueReceivables
 *         - overduePercentage
 *         - currentReceivables
 *         - averagePaymentDelayDays
 *         - totalInvoicesCount
 *         - overdueInvoicesCount
 *         - agingStructure
 */
class DashboardSummaryDto {
    constructor() {
        Object.defineProperty(this, "totalReceivables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "overdueReceivables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "overduePercentage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // % просроченной ДЗ
        Object.defineProperty(this, "currentReceivables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Непросроченная ДЗ
        Object.defineProperty(this, "averagePaymentDelayDays", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Средний срок просрочки
        Object.defineProperty(this, "totalInvoicesCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Общее количество счетов
        Object.defineProperty(this, "overdueInvoicesCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Количество просроченных счетов
        Object.defineProperty(this, "agingStructure", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.DashboardSummaryDto = DashboardSummaryDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "totalReceivables", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "overdueReceivables", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "overduePercentage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "currentReceivables", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "averagePaymentDelayDays", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "totalInvoicesCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "overdueInvoicesCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => AgingBucketDto),
    __metadata("design:type", Array)
], DashboardSummaryDto.prototype, "agingStructure", void 0);
//# sourceMappingURL=dashboard-summary.dto.js.map