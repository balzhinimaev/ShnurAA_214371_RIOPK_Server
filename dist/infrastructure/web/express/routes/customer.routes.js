"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/customer.routes.ts
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
// import { validationMiddleware } from '../middlewares/validation.middleware';
// import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto';
const router = (0, express_1.Router)();
const customerController = new customer_controller_1.CustomerController();
// --- Применяем общую аутентификацию ко всем маршрутам ---
router.use(auth_middleware_1.authMiddleware);
// --- Маршруты для /api/v1/customers ---
/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить глобальный список клиентов
 *     description: Возвращает список всех клиентов в системе с пагинацией и сортировкой. Доступно ролям ADMIN, ANALYST и MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # ... (параметры limit, offset, sortBy, sortOrder остаются)
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