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
 * /reports/abc-analysis:
 *   get:
 *     tags: [Отчеты]
 *     summary: ABC-анализ контрагентов
 *     description: Группировка контрагентов по принципу Парето (80/20) для выявления ключевых должников. Группа A - до 80% задолженности, группа B - от 80% до 95%, группа C - от 95% до 100%.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Дата расчета (опционально, по умолчанию - текущая дата)
 *     responses:
 *       200:
 *         description: Результат ABC-анализа контрагентов.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupA:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: string
 *                       enum: [A]
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customerId:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                           customerUnp:
 *                             type: string
 *                           totalDebt:
 *                             type: number
 *                           overdueDebt:
 *                             type: number
 *                           invoiceCount:
 *                             type: integer
 *                           oldestDebtDays:
 *                             type: integer
 *                           cumulativePercentage:
 *                             type: number
 *                             description: Накопительный процент от общей суммы задолженности
 *                     totalDebt:
 *                       type: number
 *                     percentageOfTotal:
 *                       type: number
 *                     customerCount:
 *                       type: integer
 *                     percentageOfCustomers:
 *                       type: number
 *                 groupB:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: string
 *                       enum: [B]
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalDebt:
 *                       type: number
 *                     percentageOfTotal:
 *                       type: number
 *                     customerCount:
 *                       type: integer
 *                     percentageOfCustomers:
 *                       type: number
 *                 groupC:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: string
 *                       enum: [C]
 *                     customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalDebt:
 *                       type: number
 *                     percentageOfTotal:
 *                       type: number
 *                     customerCount:
 *                       type: integer
 *                     percentageOfCustomers:
 *                       type: number
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: integer
 *                     totalDebt:
 *                       type: number
 *                     asOfDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/abc-analysis', reportController.getAbcAnalysis);
/**
 * @openapi
 * /reports/risk-concentration:
 *   get:
 *     tags: [Отчеты]
 *     summary: Анализ концентрации рисков
 *     description: Возвращает удельный вес дебиторской задолженности по контрагентам в процентах от общей суммы. Позволяет выявить концентрацию рисков.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Дата расчета (опционально, по умолчанию - текущая дата)
 *       - in: query
 *         name: minPercentage
 *         schema:
 *           type: number
 *         description: Минимальный процент для фильтрации контрагентов (опционально)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Ограничение количества контрагентов в результате (опционально)
 *     responses:
 *       200:
 *         description: Результат анализа концентрации рисков.
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
 *                       invoiceCount:
 *                         type: integer
 *                       oldestDebtDays:
 *                         type: integer
 *                       percentageOfTotal:
 *                         type: number
 *                         description: Удельный вес задолженности контрагента в процентах от общей суммы ДЗ
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: integer
 *                       description: Общее количество контрагентов с задолженностью
 *                     totalDebt:
 *                       type: number
 *                       description: Общая сумма задолженности
 *                     asOfDate:
 *                       type: string
 *                       format: date-time
 *                       description: Дата расчета
 *                     maxConcentration:
 *                       type: number
 *                       description: Максимальная концентрация (процент самого крупного должника)
 *                     top5Concentration:
 *                       type: number
 *                       description: Концентрация топ-5 должников (%)
 *                     top10Concentration:
 *                       type: number
 *                       description: Концентрация топ-10 должников (%)
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/risk-concentration', reportController.getRiskConcentration);
/**
 * @openapi
 * /reports/contract-analysis:
 *   get:
 *     tags: [Отчеты]
 *     summary: Анализ в разрезе договоров
 *     description: Возвращает детализацию дебиторской задолженности по договорам с информацией о всех счетах по каждому договору.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Дата расчета (опционально, по умолчанию - текущая дата)
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Фильтр по ID контрагента (опционально)
 *       - in: query
 *         name: contractNumber
 *         schema:
 *           type: string
 *         description: Фильтр по номеру договора (опционально)
 *       - in: query
 *         name: includePaid
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Включать ли оплаченные счета (по умолчанию false)
 *     responses:
 *       200:
 *         description: Результат анализа по договорам.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       contractNumber:
 *                         type: string
 *                         description: Номер договора
 *                       customerId:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       customerUnp:
 *                         type: string
 *                       serviceType:
 *                         type: string
 *                       manager:
 *                         type: string
 *                       totalDebt:
 *                         type: number
 *                         description: Общая задолженность по договору
 *                       overdueDebt:
 *                         type: number
 *                         description: Просроченная задолженность
 *                       currentDebt:
 *                         type: number
 *                         description: Текущая задолженность (без просрочки)
 *                       invoiceCount:
 *                         type: integer
 *                         description: Количество счетов по договору
 *                       overdueInvoiceCount:
 *                         type: integer
 *                         description: Количество просроченных счетов
 *                       oldestDebtDays:
 *                         type: integer
 *                         description: Возраст самой старой задолженности (в днях)
 *                       invoices:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             invoiceId:
 *                               type: string
 *                             invoiceNumber:
 *                               type: string
 *                             issueDate:
 *                               type: string
 *                               format: date-time
 *                             dueDate:
 *                               type: string
 *                               format: date-time
 *                             totalAmount:
 *                               type: number
 *                             paidAmount:
 *                               type: number
 *                             outstandingAmount:
 *                               type: number
 *                             overdueAmount:
 *                               type: number
 *                             daysOverdue:
 *                               type: integer
 *                             status:
 *                               type: string
 *                             debtWorkStatus:
 *                               type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalContracts:
 *                       type: integer
 *                       description: Общее количество договоров с задолженностью
 *                     totalDebt:
 *                       type: number
 *                       description: Общая сумма задолженности
 *                     totalOverdueDebt:
 *                       type: number
 *                       description: Общая просроченная задолженность
 *                     totalInvoices:
 *                       type: integer
 *                       description: Общее количество счетов
 *                     totalOverdueInvoices:
 *                       type: integer
 *                       description: Общее количество просроченных счетов
 *                     asOfDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Ошибка авторизации.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get('/contract-analysis', reportController.getContractAnalysis);
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
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Фильтр по ID клиента
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Минимальная сумма задолженности
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Максимальная сумма задолженности
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Срок оплаты от (ISO date)
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Срок оплаты до (ISO date)
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
exports.default = router;
//# sourceMappingURL=report.routes.js.map