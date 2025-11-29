// src/infrastructure/web/express/controllers/report.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { GetDashboardSummaryUseCase } from '../../../../application/use-cases/reports/get-dashboard-summary.use-case';
import { GetTopDebtorsUseCase } from '../../../../application/use-cases/reports/get-top-debtors.use-case';
import { ListInvoicesUseCase } from '../../../../application/use-cases/reports/list-invoices.use-case';
import { ApplyPaymentUseCase } from '../../../../application/use-cases/reports/apply-payment.use-case';
import { GetCustomersOverdueUseCase } from '../../../../application/use-cases/reports/get-customers-overdue.use-case';
import { GetAbcAnalysisUseCase } from '../../../../application/use-cases/reports/get-abc-analysis.use-case';
import { GetRiskConcentrationUseCase } from '../../../../application/use-cases/reports/get-risk-concentration.use-case';
import { GetContractAnalysisUseCase } from '../../../../application/use-cases/reports/get-contract-analysis.use-case';
import { GetRecommendationsUseCase } from '../../../../application/use-cases/reports/get-recommendations.use-case';
import { GetInvoiceDetailsUseCase } from '../../../../application/use-cases/reports/get-invoice-details.use-case';
import { GetReceivablesDynamicsUseCase } from '../../../../application/use-cases/reports/get-receivables-dynamics.use-case';
import { GetReceivablesStructureUseCase } from '../../../../application/use-cases/reports/get-receivables-structure.use-case';
import { GetSummaryReportUseCase } from '../../../../application/use-cases/reports/get-summary-report.use-case';
import { AgingBucket } from '../../../../application/dtos/reports/customers-overdue-filters.dto';
import { getOverdueCategory, getRecommendation } from '../../../../domain/enums/overdue-category.enum';
import { getDueStatus, getDaysUntilDue } from '../../../../domain/types/payment.types';

export class ReportController {
    async getDashboardSummary(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getDashboardSummaryUseCase = container.resolve(
                GetDashboardSummaryUseCase,
            );
            const summaryDto = await getDashboardSummaryUseCase.execute();
            res.status(200).json(summaryDto);
        } catch (error) {
            next(error);
        }
    }

    async getTopDebtors(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const getTopDebtorsUseCase = container.resolve(
                GetTopDebtorsUseCase,
            );
            const topDebtors = await getTopDebtorsUseCase.execute({ limit });
            res.status(200).json(topDebtors);
        } catch (error) {
            next(error);
        }
    }

    async listInvoices(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const listInvoicesUseCase = container.resolve(ListInvoicesUseCase);

            // Извлекаем параметры фильтрации из query
            const filters: any = {};
            if (req.query.status) filters.status = req.query.status as string;
            if (req.query.debtWorkStatus)
                filters.debtWorkStatus = req.query.debtWorkStatus as string;
            if (req.query.serviceType)
                filters.serviceType = req.query.serviceType as string;
            if (req.query.manager)
                filters.manager = req.query.manager as string;
            if (req.query.customerId)
                filters.customerId = req.query.customerId as string;
            if (req.query.isOverdue !== undefined)
                filters.isOverdue = req.query.isOverdue === 'true';
            if (req.query.minAmount)
                filters.minAmount = parseFloat(req.query.minAmount as string);
            if (req.query.maxAmount)
                filters.maxAmount = parseFloat(req.query.maxAmount as string);
            if (req.query.dueDateFrom)
                filters.dueDateFrom = new Date(req.query.dueDateFrom as string);
            if (req.query.dueDateTo)
                filters.dueDateTo = new Date(req.query.dueDateTo as string);
            if (req.query.minDaysOverdue)
                filters.minDaysOverdue = parseInt(
                    req.query.minDaysOverdue as string,
                );
            if (req.query.maxDaysOverdue)
                filters.maxDaysOverdue = parseInt(
                    req.query.maxDaysOverdue as string,
                );

            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;
            const sortBy = (req.query.sortBy as string) || 'dueDate';
            const sortOrder =
                (req.query.sortOrder as 'asc' | 'desc') || 'asc';

            const result = await listInvoicesUseCase.execute({
                filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            });

            const currentDate = new Date();

            // Расширяем счета новыми полями
            const enrichedInvoices = result.invoices.map((invoice: any) => {
                const invoiceJson = invoice.toJSON();
                
                // Вычисляем дни просрочки (положительное = просрочка)
                const dueDate = new Date(invoice.dueDate);
                const diffMs = currentDate.getTime() - dueDate.getTime();
                const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                // Вычисляем дни до срока (положительное = до срока, отрицательное = просрочка)
                const daysUntilDue = getDaysUntilDue(dueDate, currentDate);
                
                // Определяем статус срока
                const dueStatus = getDueStatus(dueDate, currentDate);
                
                // Определяем категорию просрочки и рекомендацию
                const overdueCategory = getOverdueCategory(daysOverdue);
                const recommendation = getRecommendation(overdueCategory);

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
        } catch (error) {
            next(error);
        }
    }

    async applyPayment(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const applyPaymentUseCase = container.resolve(ApplyPaymentUseCase);
            const { invoiceId, amount, paymentDate } = req.body;

            const updatedInvoice = await applyPaymentUseCase.execute({
                invoiceId,
                amount,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
            });

            res.status(200).json(updatedInvoice);
        } catch (error) {
            next(error);
        }
    }

    async getCustomersWithOverdue(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getCustomersOverdueUseCase = container.resolve(
                GetCustomersOverdueUseCase,
            );

            // Извлекаем параметры фильтрации из query
            const filters: any = {};
            
            if (req.query.agingBucket) {
                const rawAgingBucket = (req.query.agingBucket as string).trim();
                const normalizedBucket = rawAgingBucket
                    .toUpperCase()
                    .replace(/-/g, '_')
                    .replace(/\+/g, '_PLUS')
                    .replace(/\s+/g, '_');

                const aliasMapping: Record<string, AgingBucket> = {
                    CURRENT: AgingBucket.CURRENT,
                    'CURRENT_BUCKET': AgingBucket.CURRENT,
                    '0': AgingBucket.CURRENT,
                    '1_30': AgingBucket.DAYS_1_30,
                    '1-30': AgingBucket.DAYS_1_30,
                    '1 30': AgingBucket.DAYS_1_30,
                    '30': AgingBucket.DAYS_1_30,
                    '31_60': AgingBucket.DAYS_31_60,
                    '31-60': AgingBucket.DAYS_31_60,
                    '31 60': AgingBucket.DAYS_31_60,
                    '60': AgingBucket.DAYS_31_60,
                    '61_90': AgingBucket.DAYS_61_90,
                    '61-90': AgingBucket.DAYS_61_90,
                    '61 90': AgingBucket.DAYS_61_90,
                    '90': AgingBucket.DAYS_61_90,
                    '91_PLUS': AgingBucket.DAYS_91_PLUS,
                    '91-PLUS': AgingBucket.DAYS_91_PLUS,
                    '91 PLUS': AgingBucket.DAYS_91_PLUS,
                    '91+': AgingBucket.DAYS_91_PLUS,
                    '91': AgingBucket.DAYS_91_PLUS,
                    '100': AgingBucket.DAYS_91_PLUS,
                };

                const resolvedBucket =
                    aliasMapping[normalizedBucket] ??
                    aliasMapping[rawAgingBucket.toUpperCase()];

                if (resolvedBucket) {
                    filters.agingBucket = resolvedBucket;
                } else if (
                    (Object.values(AgingBucket) as string[]).includes(
                        normalizedBucket,
                    )
                ) {
                    filters.agingBucket = normalizedBucket as AgingBucket;
                } else {
                    console.warn(
                        `Invalid agingBucket provided: ${rawAgingBucket}`,
                    );
                }
            }
            
            if (req.query.minDaysOverdue !== undefined) {
                filters.minDaysOverdue = parseInt(
                    req.query.minDaysOverdue as string,
                );
            }
            
            if (req.query.maxDaysOverdue !== undefined) {
                filters.maxDaysOverdue = parseInt(
                    req.query.maxDaysOverdue as string,
                );
            }
            
            if (req.query.minOverdueAmount !== undefined) {
                filters.minOverdueAmount = parseFloat(
                    req.query.minOverdueAmount as string,
                );
            }
            
            if (req.query.includeCurrent !== undefined) {
                filters.includeCurrent = req.query.includeCurrent === 'true';
            }

            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;
            const sortBy = (req.query.sortBy as
                | 'overdueAmount'
                | 'oldestDebtDays'
                | 'totalDebt'
                | 'customerName') || 'overdueAmount';
            const sortOrder =
                (req.query.sortOrder as 'asc' | 'desc') || 'desc';

            const result = await getCustomersOverdueUseCase.execute({
                filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAbcAnalysis(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getAbcAnalysisUseCase = container.resolve(
                GetAbcAnalysisUseCase,
            );

            // Опциональный параметр даты расчета
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate as string)
                : undefined;

            const result = await getAbcAnalysisUseCase.execute({
                asOfDate,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getRiskConcentration(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getRiskConcentrationUseCase = container.resolve(
                GetRiskConcentrationUseCase,
            );

            // Опциональные параметры
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate as string)
                : undefined;
            const minPercentage = req.query.minPercentage
                ? parseFloat(req.query.minPercentage as string)
                : undefined;
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : undefined;

            const result = await getRiskConcentrationUseCase.execute({
                asOfDate,
                minPercentage,
                limit,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getContractAnalysis(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getContractAnalysisUseCase = container.resolve(
                GetContractAnalysisUseCase,
            );

            // Опциональные параметры
            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate as string)
                : undefined;
            const customerId = req.query.customerId as string | undefined;
            const contractNumber = req.query.contractNumber as string | undefined;
            const includePaid = req.query.includePaid === 'true';

            const result = await getContractAnalysisUseCase.execute({
                asOfDate,
                customerId,
                contractNumber,
                includePaid,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /reports/recommendations
     * Получение сводки рекомендаций по всем счетам
     */
    async getRecommendations(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getRecommendationsUseCase = container.resolve(
                GetRecommendationsUseCase,
            );

            const result = await getRecommendationsUseCase.execute();

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /reports/invoices/:id
     * Получение детальной информации о счете с историей платежей
     */
    async getInvoiceDetails(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const invoiceId = req.params.id;
            
            const getInvoiceDetailsUseCase = container.resolve(
                GetInvoiceDetailsUseCase,
            );

            const result = await getInvoiceDetailsUseCase.execute(invoiceId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getReceivablesDynamics(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getReceivablesDynamicsUseCase = container.resolve(
                GetReceivablesDynamicsUseCase,
            );

            const startDate = req.query.startDate
                ? new Date(req.query.startDate as string)
                : undefined;
            const endDate = req.query.endDate
                ? new Date(req.query.endDate as string)
                : undefined;

            const result = await getReceivablesDynamicsUseCase.execute({
                startDate,
                endDate,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getReceivablesStructure(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getReceivablesStructureUseCase = container.resolve(
                GetReceivablesStructureUseCase,
            );

            const asOfDate = req.query.asOfDate
                ? new Date(req.query.asOfDate as string)
                : undefined;

            const result = await getReceivablesStructureUseCase.execute(asOfDate);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getSummaryReport(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const getSummaryReportUseCase = container.resolve(
                GetSummaryReportUseCase,
            );

            const result = await getSummaryReportUseCase.execute();

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
