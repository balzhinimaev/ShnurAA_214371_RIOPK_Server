"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const tsyringe_1 = require("tsyringe");
const get_dashboard_summary_use_case_1 = require("../../../../application/use-cases/reports/get-dashboard-summary.use-case");
class ReportController {
    async getDashboardSummary(_req, res, next) {
        try {
            const getDashboardSummaryUseCase = tsyringe_1.container.resolve(get_dashboard_summary_use_case_1.GetDashboardSummaryUseCase);
            const summaryDto = await getDashboardSummaryUseCase.execute();
            res.status(200).json(summaryDto);
        }
        catch (error) {
            next(error); // Передаем в error handler
        }
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map