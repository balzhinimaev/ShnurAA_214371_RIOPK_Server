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
 * Сводка по категориям для рекомендаций
 */
class RecommendationsCategorySummaryDto {
    constructor() {
        Object.defineProperty(this, "count", {
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
    }
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RecommendationsCategorySummaryDto.prototype, "count", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RecommendationsCategorySummaryDto.prototype, "totalAmount", void 0);
/**
 * Сводка рекомендаций по категориям для dashboard
 */
class RecommendationsSummaryForDashboardDto {
    constructor() {
        Object.defineProperty(this, "NOT_DUE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "NOTIFY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "CLAIM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "COURT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "BAD_DEBT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsCategorySummaryDto),
    __metadata("design:type", RecommendationsCategorySummaryDto)
], RecommendationsSummaryForDashboardDto.prototype, "NOT_DUE", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsCategorySummaryDto),
    __metadata("design:type", RecommendationsCategorySummaryDto)
], RecommendationsSummaryForDashboardDto.prototype, "NOTIFY", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsCategorySummaryDto),
    __metadata("design:type", RecommendationsCategorySummaryDto)
], RecommendationsSummaryForDashboardDto.prototype, "CLAIM", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsCategorySummaryDto),
    __metadata("design:type", RecommendationsCategorySummaryDto)
], RecommendationsSummaryForDashboardDto.prototype, "COURT", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsCategorySummaryDto),
    __metadata("design:type", RecommendationsCategorySummaryDto)
], RecommendationsSummaryForDashboardDto.prototype, "BAD_DEBT", void 0);
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
 *         averageReceivables:
 *           type: number
 *           format: float
 *           description: Средняя дебиторская задолженность за период (текущий месяц). Рассчитывается как (ДЗ на начало периода + ДЗ на конец периода) / 2.
 *           example: 250000.00
 *         turnoverRatio:
 *           type: number
 *           format: float
 *           description: Оборачиваемость дебиторской задолженности. Показывает, сколько раз за период ДЗ превратилась в денежные средства. Рассчитывается как выручка за период / средняя ДЗ.
 *           example: 4.5
 *         periodRevenue:
 *           type: number
 *           format: float
 *           description: Выручка за период (текущий месяц). Сумма всех счетов, созданных в текущем месяце.
 *           example: 1125000.00
 *         averagePaymentDays:
 *           type: number
 *           format: float
 *           description: Средний срок оплаты (от выставления счета до оплаты, в днях). Рассчитывается на основе истории платежей.
 *           example: 28.5
 *         onTimePaymentsAmount:
 *           type: number
 *           format: float
 *           description: Сумма платежей, которые были произведены в срок (paymentDate <= dueDate).
 *           example: 850000.00
 *         overduePaymentsPercentage:
 *           type: number
 *           format: float
 *           description: Процент просроченных платежей от общей суммы всех платежей. Рассчитывается на основе истории платежей.
 *           example: 15.3
 *       required:
 *         - totalReceivables
 *         - overdueReceivables
 *         - overduePercentage
 *         - currentReceivables
 *         - averagePaymentDelayDays
 *         - totalInvoicesCount
 *         - overdueInvoicesCount
 *         - agingStructure
 *         - averageReceivables
 *         - turnoverRatio
 *         - periodRevenue
 *         - averagePaymentDays
 *         - onTimePaymentsAmount
 *         - overduePaymentsPercentage
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
        Object.defineProperty(this, "averageReceivables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Средняя ДЗ за период
        Object.defineProperty(this, "turnoverRatio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Оборачиваемость ДЗ
        Object.defineProperty(this, "periodRevenue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Выручка за период
        Object.defineProperty(this, "averagePaymentDays", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Средний срок оплаты (от выставления до оплаты)
        Object.defineProperty(this, "onTimePaymentsAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Сумма платежей в срок
        Object.defineProperty(this, "overduePaymentsPercentage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Процент просроченных платежей
        Object.defineProperty(this, "recommendationsSummary", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Сводка по категориям рекомендаций
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
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "averageReceivables", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "turnoverRatio", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "periodRevenue", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "averagePaymentDays", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "onTimePaymentsAmount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DashboardSummaryDto.prototype, "overduePaymentsPercentage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RecommendationsSummaryForDashboardDto),
    __metadata("design:type", RecommendationsSummaryForDashboardDto)
], DashboardSummaryDto.prototype, "recommendationsSummary", void 0);
//# sourceMappingURL=dashboard-summary.dto.js.map