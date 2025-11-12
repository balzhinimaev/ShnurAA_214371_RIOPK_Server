"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const tsyringe_1 = require("tsyringe");
const get_dashboard_summary_use_case_1 = require("../../../../application/use-cases/reports/get-dashboard-summary.use-case");
const get_top_debtors_use_case_1 = require("../../../../application/use-cases/reports/get-top-debtors.use-case");
const list_invoices_use_case_1 = require("../../../../application/use-cases/reports/list-invoices.use-case");
const apply_payment_use_case_1 = require("../../../../application/use-cases/reports/apply-payment.use-case");
const get_customers_overdue_use_case_1 = require("../../../../application/use-cases/reports/get-customers-overdue.use-case");
const get_abc_analysis_use_case_1 = require("../../../../application/use-cases/reports/get-abc-analysis.use-case");
const get_risk_concentration_use_case_1 = require("../../../../application/use-cases/reports/get-risk-concentration.use-case");
const get_contract_analysis_use_case_1 = require("../../../../application/use-cases/reports/get-contract-analysis.use-case");
const customers_overdue_filters_dto_1 = require("../../../../application/dtos/reports/customers-overdue-filters.dto");
class ReportController {
    async getDashboardSummary(_req, res, next) {
        try {
            const getDashboardSummaryUseCase = tsyringe_1.container.resolve(get_dashboard_summary_use_case_1.GetDashboardSummaryUseCase);
            const summaryDto = await getDashboardSummaryUseCase.execute();
            res.status(200).json(summaryDto);
        }
        catch (error) {
            next(error);
        }
    }
    async getTopDebtors(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const getTopDebtorsUseCase = tsyringe_1.container.resolve(get_top_debtors_use_case_1.GetTopDebtorsUseCase);
            const topDebtors = await getTopDebtorsUseCase.execute({ limit });
            res.status(200).json(topDebtors);
        }
        catch (error) {
            next(error);
        }
    }
    async listInvoices(req, res, next) {
        try {
            const listInvoicesUseCase = tsyringe_1.container.resolve(list_invoices_use_case_1.ListInvoicesUseCase);
            // Извлекаем параметры фильтрации из query
            const filters = {};
            if (req.query.status)
                filters.status = req.query.status;
            if (req.query.debtWorkStatus)
                filters.debtWorkStatus = req.query.debtWorkStatus;
            if (req.query.serviceType)
                filters.serviceType = req.query.serviceType;
            if (req.query.manager)
                filters.manager = req.query.manager;
            if (req.query.customerId)
                filters.customerId = req.query.customerId;
            if (req.query.isOverdue !== undefined)
                filters.isOverdue = req.query.isOverdue === 'true';
            if (req.query.minAmount)
                filters.minAmount = parseFloat(req.query.minAmount);
            if (req.query.maxAmount)
                filters.maxAmount = parseFloat(req.query.maxAmount);
            if (req.query.dueDateFrom)
                filters.dueDateFrom = new Date(req.query.dueDateFrom);
            if (req.query.dueDateTo)
                filters.dueDateTo = new Date(req.query.dueDateTo);
            if (req.query.minDaysOverdue)
                filters.minDaysOverdue = parseInt(req.query.minDaysOverdue);
            if (req.query.maxDaysOverdue)
                filters.maxDaysOverdue = parseInt(req.query.maxDaysOverdue);
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const sortBy = req.query.sortBy || 'dueDate';
            const sortOrder = req.query.sortOrder || 'asc';
            const result = await listInvoicesUseCase.execute({
                filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async applyPayment(req, res, next) {
        try {
            const applyPaymentUseCase = tsyringe_1.container.resolve(apply_payment_use_case_1.ApplyPaymentUseCase);
            const { invoiceId, amount, paymentDate } = req.body;
            const updatedInvoice = await applyPaymentUseCase.execute({
                invoiceId,
                amount,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
            });
            res.status(200).json(updatedInvoice);
        }
        catch (error) {
            next(error);
        }
    }
    async getCustomersWithOverdue(req, res, next) {
        try {
            const getCustomersOverdueUseCase = tsyringe_1.container.resolve(get_customers_overdue_use_case_1.GetCustomersOverdueUseCase);
            // Извлекаем параметры фильтрации из query
            const filters = {};
            if (req.query.agingBucket) {
                const rawAgingBucket = req.query.agingBucket.trim();
                const normalizedBucket = rawAgingBucket
                    .toUpperCase()
                    .replace(/-/g, '_')
                    .replace(/\+/g, '_PLUS')
                    .replace(/\s+/g, '_');
                const aliasMapping = {
                    CURRENT: customers_overdue_filters_dto_1.AgingBucket.CURRENT,
                    'CURRENT_BUCKET': customers_overdue_filters_dto_1.AgingBucket.CURRENT,
                    '0': customers_overdue_filters_dto_1.AgingBucket.CURRENT,
                    '1_30': customers_overdue_filters_dto_1.AgingBucket.DAYS_1_30,
                    '1-30': customers_overdue_filters_dto_1.AgingBucket.DAYS_1_30,
                    '1 30': customers_overdue_filters_dto_1.AgingBucket.DAYS_1_30,
                    '30': customers_overdue_filters_dto_1.AgingBucket.DAYS_1_30,
                    '31_60': customers_overdue_filters_dto_1.AgingBucket.DAYS_31_60,
                    '31-60': customers_overdue_filters_dto_1.AgingBucket.DAYS_31_60,
                    '31 60': customers_overdue_filters_dto_1.AgingBucket.DAYS_31_60,
                    '60': customers_overdue_filters_dto_1.AgingBucket.DAYS_31_60,
                    '61_90': customers_overdue_filters_dto_1.AgingBucket.DAYS_61_90,
                    '61-90': customers_overdue_filters_dto_1.AgingBucket.DAYS_61_90,
                    '61 90': customers_overdue_filters_dto_1.AgingBucket.DAYS_61_90,
                    '90': customers_overdue_filters_dto_1.AgingBucket.DAYS_61_90,
                    '91_PLUS': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                    '91-PLUS': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                    '91 PLUS': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                    '91+': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                    '91': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                    '100': customers_overdue_filters_dto_1.AgingBucket.DAYS_91_PLUS,
                };
                const resolvedBucket = aliasMapping[normalizedBucket] ??
                    aliasMapping[rawAgingBucket.toUpperCase()];
                if (resolvedBucket) {
                    filters.agingBucket = resolvedBucket;
                }
                else if (Object.values(customers_overdue_filters_dto_1.AgingBucket).includes(normalizedBucket)) {
                    filters.agingBucket = normalizedBucket;
                }
                else {
                    console.warn(`Invalid agingBucket provided: ${rawAgingBucket}`);
                }
            }
            if (req.query.minDaysOverdue !== undefined) {
                filters.minDaysOverdue = parseInt(req.query.minDaysOverdue);
            }
            if (req.query.maxDaysOverdue !== undefined) {
                filters.maxDaysOverdue = parseInt(req.query.maxDaysOverdue);
            }
            if (req.query.minOverdueAmount !== undefined) {
                filters.minOverdueAmount = parseFloat(req.query.minOverdueAmount);
            }
            if (req.query.includeCurrent !== undefined) {
                filters.includeCurrent = req.query.includeCurrent === 'true';
            }
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const sortBy = req.query.sortBy || 'overdueAmount';
            const sortOrder = req.query.sortOrder || 'desc';
            const result = await getCustomersOverdueUseCase.execute({
                filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getAbcAnalysis(req, res, next) {
        try {
            const getAbcAnalysisUseCase = tsyringe_1.container.resolve(get_abc_analysis_use_case_1.GetAbcAnalysisUseCase);
            // Опциональный параметр даты расчета
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate)
                : undefined;
            const result = await getAbcAnalysisUseCase.execute({
                asOfDate,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getRiskConcentration(req, res, next) {
        try {
            const getRiskConcentrationUseCase = tsyringe_1.container.resolve(get_risk_concentration_use_case_1.GetRiskConcentrationUseCase);
            // Опциональные параметры
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate)
                : undefined;
            const minPercentage = req.query.minPercentage
                ? parseFloat(req.query.minPercentage)
                : undefined;
            const limit = req.query.limit
                ? parseInt(req.query.limit)
                : undefined;
            const result = await getRiskConcentrationUseCase.execute({
                asOfDate,
                minPercentage,
                limit,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getContractAnalysis(req, res, next) {
        try {
            const getContractAnalysisUseCase = tsyringe_1.container.resolve(get_contract_analysis_use_case_1.GetContractAnalysisUseCase);
            // Опциональные параметры
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate)
                : undefined;
            const customerId = req.query.customerId;
            const contractNumber = req.query.contractNumber;
            const includePaid = req.query.includePaid === 'true';
            const result = await getContractAnalysisUseCase.execute({
                asOfDate,
                customerId,
                contractNumber,
                includePaid,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map