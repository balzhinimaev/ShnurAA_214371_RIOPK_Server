// src/infrastructure/web/express/routes/customer.routes.ts
import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { DebtWorkController } from '../controllers/debt-work.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
// import { validationMiddleware } from '../middlewares/validation.middleware';
// import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto';

const router = Router();
const customerController = new CustomerController();
const debtWorkController = new DebtWorkController();

// --- Применяем общую аутентификацию ко всем маршрутам ---
router.use(authMiddleware);

// --- Маршруты для /api/v1/customers ---

/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить глобальный список клиентов
 *     description: Возвращает список всех клиентов в системе с пагинацией, сортировкой и фильтрацией. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *           enum: [name, unp, createdAt, updatedAt]
 *           default: name
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Направление сортировки
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Фильтр по названию клиента (регистронезависимый поиск)
 *       - in: query
 *         name: unp
 *         schema:
 *           type: string
 *         description: Фильтр по УНП (регистронезависимый поиск)
 *       - in: query
 *         name: contactInfo
 *         schema:
 *           type: string
 *         description: Фильтр по контактной информации (регистронезависимый поиск)
 *     responses:
 *       '200':
 *         description: Успешный ответ со списком клиентов.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListCustomersResponseDto'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError' # Если роль не совпала
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
    '/',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']), // Разрешаем всем читать
    customerController.getAllCustomers,
);

/**
 * @openapi
 * /customers/{customerId}/debt-work:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить историю работы с задолженностями клиента
 *     description: Возвращает историю работы с задолженностями и статистику рисковости клиента. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID клиента
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Фильтр по ID счета (опционально)
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
 *           enum: [actionDate, createdAt]
 *           default: actionDate
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Направление сортировки
 *     responses:
 *       '200':
 *         description: Успешный ответ с историей и статистикой.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DebtWorkHistoryResponseDto'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
    '/:customerId/debt-work',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']),
    debtWorkController.getDebtWorkHistory,
);

/**
 * @openapi
 * /customers/{customerId}/debt-work:
 *   post:
 *     tags: [Клиенты]
 *     summary: Создать запись о работе с задолженностью
 *     description: Создает новую запись о работе с задолженностью клиента. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID клиента
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDebtWorkRecordDto'
 *     responses:
 *       '201':
 *         description: Запись успешно создана.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DebtWorkRecordDto'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
    '/:customerId/debt-work',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']),
    debtWorkController.createDebtWorkRecord,
);

/**
 * @openapi
 * /customers/{customerId}/debt-work/{recordId}:
 *   put:
 *     tags: [Клиенты]
 *     summary: Обновить запись о работе с задолженностью
 *     description: Обновляет существующую запись о работе с задолженностью клиента. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID клиента
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи о работе с задолженностью
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDebtWorkRecordDto'
 *     responses:
 *       '200':
 *         description: Запись успешно обновлена.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DebtWorkRecordDto'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         description: Запись не принадлежит указанному клиенту
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
    '/:customerId/debt-work/:recordId',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']),
    debtWorkController.updateDebtWorkRecord,
);

/**
 * @openapi
 * /customers/{customerId}/debt-work/{recordId}:
 *   delete:
 *     tags: [Клиенты]
 *     summary: Удалить запись о работе с задолженностью
 *     description: Удаляет запись о работе с задолженностью клиента. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID клиента
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID записи о работе с задолженностью
 *     responses:
 *       '204':
 *         description: Запись успешно удалена.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         description: Запись не принадлежит указанному клиенту
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
    '/:customerId/debt-work/:recordId',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']),
    debtWorkController.deleteDebtWorkRecord,
);

/**
 * @openapi
 * /customers/{id}/full:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить полные данные дебитора с аналитикой
 *     description: Возвращает полную информацию о дебиторе включая список задолженностей, статистику платежей, оценку рисков и рейтинг платежеспособности.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID дебитора
 *     responses:
 *       '200':
 *         description: Полные данные о дебиторе.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 unp:
 *                   type: string
 *                 contactInfo:
 *                   type: string
 *                 invoices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       invoiceNumber:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       outstandingAmount:
 *                         type: number
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       daysOverdue:
 *                         type: integer
 *                       overdueCategory:
 *                         type: string
 *                         enum: [NOT_DUE, NOTIFY, CLAIM, COURT, BAD_DEBT]
 *                       status:
 *                         type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalInvoices:
 *                       type: integer
 *                     totalDebt:
 *                       type: number
 *                     overdueDebt:
 *                       type: number
 *                     paidOnTimeCount:
 *                       type: integer
 *                     paidLateCount:
 *                       type: integer
 *                     averagePaymentDelay:
 *                       type: number
 *                     onTimePaymentRate:
 *                       type: number
 *                 riskAssessment:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                     score:
 *                       type: number
 *                     factors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           factor:
 *                             type: string
 *                           description:
 *                             type: string
 *                           impact:
 *                             type: string
 *                             enum: [POSITIVE, NEGATIVE, NEUTRAL]
 *                           weight:
 *                             type: number
 *                 paymentRating:
 *                   type: object
 *                   properties:
 *                     grade:
 *                       type: string
 *                       enum: [A, B, C, D, F]
 *                     description:
 *                       type: string
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
    '/:id/full',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']),
    customerController.getCustomerFull,
);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить клиента по ID
 *     description: Возвращает детальную информацию о конкретном клиенте. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # ... (параметр id остается)
 *     responses:
 *       '200':
 *         description: Успешный ответ с данными клиента.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerResponseDto'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError' # Стандартный ответ 404
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
    '/:id',
    roleMiddleware(['ADMIN', 'ANALYST', 'MANAGER']), // Разрешаем всем читать
    customerController.getCustomerById,
);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     tags: [Клиенты]
 *     summary: Обновить клиента
 *     description: Обновляет имя и/или контактную информацию существующего клиента. Доступно ролям ADMIN и ANALYST.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # ... (параметр id остается)
 *     requestBody:
 *       # ... (тело запроса остается)
 *     responses:
 *       '200':
 *         description: Клиент успешно обновлен.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerResponseDto'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError' # Ошибка валидации DTO
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError' # Недостаточно прав
 *       '404':
 *         $ref: '#/components/responses/NotFoundError' # Клиент не найден
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
    '/:id',
    roleMiddleware(['ADMIN', 'ANALYST']), // Только эти роли могут менять
    // TODO: validationMiddleware(UpdateCustomerDto),
    customerController.updateCustomer,
);

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     tags: [Клиенты]
 *     summary: Удалить клиента
 *     description: Удаляет клиента из системы. Доступно **только** роли ADMIN. Может быть отклонено, если есть связанные данные (например, счета).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # ... (параметр id остается)
 *     responses:
 *       '204':
 *         description: Клиент успешно удален.
 *       '400':
 *         description: Нельзя удалить клиента (например, есть связанные счета).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError' # Недостаточно прав (не ADMIN)
 *       '404':
 *         $ref: '#/components/responses/NotFoundError' # Клиент не найден
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
    '/:id',
    roleMiddleware(['ADMIN']), // ТОЛЬКО Админ может удалять
    customerController.deleteCustomer,
);

export default router;
