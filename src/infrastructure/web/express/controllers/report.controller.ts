// src/infrastructure/web/express/controllers/report.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { GetDashboardSummaryUseCase } from '../../../../application/use-cases/reports/get-dashboard-summary.use-case';
import { GetTopDebtorsUseCase } from '../../../../application/use-cases/reports/get-top-debtors.use-case';
import { ListInvoicesUseCase } from '../../../../application/use-cases/reports/list-invoices.use-case';
import { ApplyPaymentUseCase } from '../../../../application/use-cases/reports/apply-payment.use-case';

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
}
