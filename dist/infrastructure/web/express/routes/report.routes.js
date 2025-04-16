"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/report.routes.ts
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const reportController = new report_controller_1.ReportController();
// Применяем authMiddleware ко всем роутам отчетов
router.use(auth_middleware_1.authMiddleware);
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
exports.default = router;
//# sourceMappingURL=report.routes.js.map