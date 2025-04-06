// src/infrastructure/web/express/routes/report.routes.ts
import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const reportController = new ReportController();

// Применяем authMiddleware ко всем роутам отчетов
router.use(authMiddleware);

/**
 * @openapi
 * /reports/dashboard/summary:
 *   get:
 *     tags: [Отчеты]
 *     summary: Получение сводки для дашборда
 *     description: Возвращает основные показатели дебиторской задолженности (общая сумма, просроченная, структура старения).
 *     security:
 *       - bearerAuth: [] # Требуется JWT Bearer токен
 *     responses:
 *       200:
 *         description: Сводные данные для дашборда.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardSummaryDto' # Ссылка на DTO ответа
 *       401:
 *         description: Ошибка авторизации.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера при расчете сводки.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/dashboard/summary', reportController.getDashboardSummary);

// TODO: Добавить аннотации для /reports/aging, если будете реализовывать

export default router;
