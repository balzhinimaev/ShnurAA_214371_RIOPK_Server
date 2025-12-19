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
const get_recommendations_use_case_1 = require("../../../../application/use-cases/reports/get-recommendations.use-case");
const get_invoice_details_use_case_1 = require("../../../../application/use-cases/reports/get-invoice-details.use-case");
const get_receivables_dynamics_use_case_1 = require("../../../../application/use-cases/reports/get-receivables-dynamics.use-case");
const get_receivables_structure_use_case_1 = require("../../../../application/use-cases/reports/get-receivables-structure.use-case");
const get_summary_report_use_case_1 = require("../../../../application/use-cases/reports/get-summary-report.use-case");
const customers_overdue_filters_dto_1 = require("../../../../application/dtos/reports/customers-overdue-filters.dto");
const overdue_category_enum_1 = require("../../../../domain/enums/overdue-category.enum");
const payment_types_1 = require("../../../../domain/types/payment.types");
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
            const currentDate = new Date();
            // Расширяем счета новыми полями
            const enrichedInvoices = result.invoices.map((invoice) => {
                const invoiceJson = invoice.toJSON();
                // Вычисляем дни просрочки (положительное = просрочка)
                const dueDate = new Date(invoice.dueDate);
                const diffMs = currentDate.getTime() - dueDate.getTime();
                const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                // Вычисляем дни до срока (положительное = до срока, отрицательное = просрочка)
                const daysUntilDue = (0, payment_types_1.getDaysUntilDue)(dueDate, currentDate);
                // Определяем статус срока
                const dueStatus = (0, payment_types_1.getDueStatus)(dueDate, currentDate);
                // Определяем категорию просрочки и рекомендацию
                const overdueCategory = (0, overdue_category_enum_1.getOverdueCategory)(daysOverdue);
                const recommendation = (0, overdue_category_enum_1.getRecommendation)(overdueCategory);
                return {
                    ...invoiceJson,
                    daysOverdue,
                    daysUntilDue,
                    dueStatus,
                    overdueCategory,
                    recommendation,
                    // TODO: добавить payments и lastPaymentDate когда будет реализован запрос к PaymentHistory
                    payments: [],
                    lastPaymentDate: invoice.actualPaymentDate || null,
                };
            });
            // Логирование для отладки структуры данных
            if (result.invoices.length > 0) {
                const firstInvoice = result.invoices[0];
                console.log('=== INVOICES API DEBUG ===');
                console.log('Total invoices:', result.invoices.length);
                console.log('First invoice ID:', firstInvoice.id);
                console.log('Has customer:', !!firstInvoice.customer);
                console.log('Customer UNP:', firstInvoice.customer?.unp);
                console.log('OutstandingAmount:', firstInvoice.outstandingAmount);
                console.log('OutstandingAmount type:', typeof firstInvoice.outstandingAmount);
                console.log('Customer structure:', firstInvoice.customer ? {
                    id: firstInvoice.customer.id,
                    name: firstInvoice.customer.name,
                    unp: firstInvoice.customer.unp,
                    hasUnp: !!firstInvoice.customer.unp,
                } : 'undefined');
                console.log('========================');
            }
            res.status(200).json({
                invoices: enrichedInvoices,
                total: result.total,
                limit: result.limit,
                offset: result.offset,
            });
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
    /**
     * GET /reports/recommendations
     * Получение сводки рекомендаций по всем счетам
     */
    async getRecommendations(_req, res, next) {
        try {
            const getRecommendationsUseCase = tsyringe_1.container.resolve(get_recommendations_use_case_1.GetRecommendationsUseCase);
            const result = await getRecommendationsUseCase.execute();
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /reports/invoices/:id
     * Получение детальной информации о счете с историей платежей
     */
    async getInvoiceDetails(req, res, next) {
        try {
            const invoiceId = req.params.id;
            const getInvoiceDetailsUseCase = tsyringe_1.container.resolve(get_invoice_details_use_case_1.GetInvoiceDetailsUseCase);
            const result = await getInvoiceDetailsUseCase.execute(invoiceId);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getReceivablesDynamics(req, res, next) {
        try {
            const getReceivablesDynamicsUseCase = tsyringe_1.container.resolve(get_receivables_dynamics_use_case_1.GetReceivablesDynamicsUseCase);
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : undefined;
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : undefined;
            const result = await getReceivablesDynamicsUseCase.execute({
                startDate,
                endDate,
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getReceivablesStructure(req, res, next) {
        try {
            const getReceivablesStructureUseCase = tsyringe_1.container.resolve(get_receivables_structure_use_case_1.GetReceivablesStructureUseCase);
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate)
                : undefined;
            const result = await getReceivablesStructureUseCase.execute(asOfDate);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getSummaryReport(_req, res, next) {
        try {
            const getSummaryReportUseCase = tsyringe_1.container.resolve(get_summary_report_use_case_1.GetSummaryReportUseCase);
            const result = await getSummaryReportUseCase.execute();
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map