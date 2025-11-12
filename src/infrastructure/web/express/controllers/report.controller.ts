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
import { AgingBucket } from '../../../../application/dtos/reports/customers-overdue-filters.dto';

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

            res.status(200).json(result);
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
}
