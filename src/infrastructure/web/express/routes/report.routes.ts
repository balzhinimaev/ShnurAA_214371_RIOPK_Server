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
 *     summary: Получение расширенной сводки для дашборда
 *     description: Возвращает детальные показатели дебиторской задолженности (общая сумма, просроченная, структура старения, средний срок оплаты).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сводные данные для дашборда.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardSummaryDto'
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/dashboard/summary', reportController.getDashboardSummary);

/**
 * @openapi
 * /reports/top-debtors:
 *   get:
 *     tags: [Отчеты]
 *     summary: Топ должников
 *     description: Возвращает топ-N должников с наибольшей задолженностью.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество должников в топе
 *     responses:
 *       200:
 *         description: Список топ должников.
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/top-debtors', reportController.getTopDebtors);

/**
 * @openapi
 * /reports/invoices:
 *   get:
 *     tags: [Отчеты]
 *     summary: Список счетов с фильтрацией
 *     description: Возвращает список счетов с возможностью фильтрации по различным параметрам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, PAID, OVERDUE]
 *         description: Фильтр по статусу
 *       - in: query
 *         name: debtWorkStatus
 *         schema:
 *           type: string
 *           enum: [IN_TIME, CALL, CLAIM, PRE_TRIAL, TRIAL, COLLECTION, WRITE_OFF, CLOSED]
 *         description: Фильтр по статусу работы с долгом
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Фильтр по типу услуги
 *       - in: query
 *         name: manager
 *         schema:
 *           type: string
 *         description: Фильтр по менеджеру
 *       - in: query
 *         name: isOverdue
 *         schema:
 *           type: boolean
 *         description: Только просроченные счета
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество записей на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: dueDate
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Порядок сортировки
 *     responses:
 *       200:
 *         description: Список счетов с фильтрацией.
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/invoices', reportController.listInvoices);

/**
 * @openapi
 * /reports/invoices/apply-payment:
 *   post:
 *     tags: [Отчеты]
 *     summary: Применение частичной оплаты
 *     description: Применяет частичную или полную оплату к счету.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 description: ID счета
 *               amount:
 *                 type: number
 *                 description: Сумма оплаты
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Дата оплаты (опционально, по умолчанию - текущая дата)
 *     responses:
 *       200:
 *         description: Счет успешно обновлен.
 *       400:
 *         description: Некорректные данные.
 *       404:
 *         description: Счет не найден.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.post('/invoices/apply-payment', reportController.applyPayment);

export default router;
