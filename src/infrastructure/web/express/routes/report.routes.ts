// src/infrastructure/web/express/routes/report.routes.ts
import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const reportController = new ReportController();

// Защищаем все роуты отчетов
router.use(authMiddleware);

// GET /api/v1/reports/dashboard/summary
router.get('/dashboard/summary', reportController.getDashboardSummary);

// GET /api/v1/reports/aging
// router.get('/aging', reportController.getAgingReport); // Если будете реализовывать

export default router;
