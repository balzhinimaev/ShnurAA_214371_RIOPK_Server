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
 * /reports/customers-overdue:
 *   get:
 *     tags: [Отчеты]
 *     summary: Клиенты с просрочкой и фильтрацией по категориям старения
 *     description: Возвращает список клиентов с просроченной задолженностью, с возможностью фильтрации по категориям просрочки (aging buckets).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agingBucket
 *         schema:
 *           type: string
 *           enum: [CURRENT, 1_30, 31_60, 61_90, 91_PLUS]
 *         description: Фильтр по категории старения (CURRENT = без просрочки, 1_30 = 1-30 дней, 31_60 = 31-60 дней, 61_90 = 61-90 дней, 91_PLUS = 91+ дней)
 *       - in: query
 *         name: minDaysOverdue
 *         schema:
 *           type: integer
 *         description: Минимальное количество дней просрочки (имеет приоритет над agingBucket)
 *       - in: query
 *         name: maxDaysOverdue
 *         schema:
 *           type: integer
 *         description: Максимальное количество дней просрочки (имеет приоритет над agingBucket)
 *       - in: query
 *         name: minOverdueAmount
 *         schema:
 *           type: number
 *         description: Минимальная сумма просроченной задолженности
 *       - in: query
 *         name: includeCurrent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Включать ли клиентов без просрочки (CURRENT)
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
 *           enum: [overdueAmount, oldestDebtDays, totalDebt, customerName]
 *           default: overdueAmount
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Порядок сортировки
 *     responses:
 *       200:
 *         description: Список клиентов с просрочкой.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customerId:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       customerUnp:
 *                         type: string
 *                       totalDebt:
 *                         type: number
 *                       overdueDebt:
 *                         type: number
 *                       currentDebt:
 *                         type: number
 *                       invoiceCount:
 *                         type: integer
 *                       overdueInvoiceCount:
 *                         type: integer
 *                       oldestDebtDays:
 *                         type: integer
 *                       agingBucket:
 *                         type: string
 *                         enum: [CURRENT, 1_30, 31_60, 61_90, 91_PLUS]
 *                       agingBreakdown:
 *                         type: object
 *                         properties:
 *                           current:
 *                             type: number
 *                           days_1_30:
 *                             type: number
 *                           days_31_60:
 *                             type: number
 *                           days_61_90:
 *                             type: number
 *                           days_91_plus:
 *                             type: number
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalOverdueAmount:
 *                       type: number
 *                     totalCustomers:
 *                       type: integer
 *                     averageDaysOverdue:
 *                       type: number
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/customers-overdue', reportController.getCustomersWithOverdue);

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
 *         name: minDaysOverdue
 *         schema:
 *           type: integer
 *         description: Минимальное количество дней просрочки (например, 30 для счетов с просрочкой 30+ дней)
 *       - in: query
 *         name: maxDaysOverdue
 *         schema:
 *           type: integer
 *         description: Максимальное количество дней просрочки (например, 60 для счетов с просрочкой до 60 дней)
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
