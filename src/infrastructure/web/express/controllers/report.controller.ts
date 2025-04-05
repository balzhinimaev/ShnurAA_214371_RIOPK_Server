// src/infrastructure/web/express/controllers/report.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { GetDashboardSummaryUseCase } from '../../../../application/use-cases/reports/get-dashboard-summary.use-case';

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
            next(error); // Передаем в error handler
        }
    }
    // async getAgingReport(req: Request, res: Response, next: NextFunction): Promise<void> { ... }
}
