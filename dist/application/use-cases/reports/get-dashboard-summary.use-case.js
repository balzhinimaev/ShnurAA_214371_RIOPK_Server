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
exports.GetDashboardSummaryUseCase = void 0;
// src/application/use-cases/reports/get-dashboard-summary.use-case.ts
const tsyringe_1 = require("tsyringe");
const IInvoiceRepository_1 = require("../../../domain/repositories/IInvoiceRepository");
const dashboard_summary_dto_1 = require("../../dtos/reports/dashboard-summary.dto");
const class_transformer_1 = require("class-transformer");
let GetDashboardSummaryUseCase = class GetDashboardSummaryUseCase {
    constructor(invoiceRepository) {
        Object.defineProperty(this, "invoiceRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: invoiceRepository
        });
    }
    async execute() {
        const summaryData = await this.invoiceRepository.getDashboardSummary();
        const summaryDto = (0, class_transformer_1.plainToInstance)(dashboard_summary_dto_1.DashboardSummaryDto, summaryData, {
            excludeExtraneousValues: true, // Важно для DTO
        });
        return summaryDto;
    }
};
exports.GetDashboardSummaryUseCase = GetDashboardSummaryUseCase;
exports.GetDashboardSummaryUseCase = GetDashboardSummaryUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(IInvoiceRepository_1.InvoiceRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], GetDashboardSummaryUseCase);
//# sourceMappingURL=get-dashboard-summary.use-case.js.map