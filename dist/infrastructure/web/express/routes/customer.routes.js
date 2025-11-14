"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/customer.routes.ts
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const debt_work_controller_1 = require("../controllers/debt-work.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
// import { validationMiddleware } from '../middlewares/validation.middleware';
// import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto';
const router = (0, express_1.Router)();
const customerController = new customer_controller_1.CustomerController();
const debtWorkController = new debt_work_controller_1.DebtWorkController();
// --- Применяем общую аутентификацию ко всем маршрутам ---
router.use(auth_middleware_1.authMiddleware);
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
router.get('/', (0, role_middleware_1.roleMiddleware)(['ADMIN', 'ANALYST', 'MANAGER']), // Разрешаем всем читать
customerController.getAllCustomers);
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
router.get('/:customerId/debt-work', (0, role_middleware_1.roleMiddleware)(['ADMIN', 'ANALYST', 'MANAGER']), debtWorkController.getDebtWorkHistory);
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
router.post('/:customerId/debt-work', (0, role_middleware_1.roleMiddleware)(['ADMIN', 'ANALYST', 'MANAGER']), debtWorkController.createDebtWorkRecord);
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
router.get('/:id', (0, role_middleware_1.roleMiddleware)(['ADMIN', 'ANALYST', 'MANAGER']), // Разрешаем всем читать
customerController.getCustomerById);
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
router.put('/:id', (0, role_middleware_1.roleMiddleware)(['ADMIN', 'ANALYST']), // Только эти роли могут менять
// TODO: validationMiddleware(UpdateCustomerDto),
customerController.updateCustomer);
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
router.delete('/:id', (0, role_middleware_1.roleMiddleware)(['ADMIN']), // ТОЛЬКО Админ может удалять
customerController.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map