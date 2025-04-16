// src/infrastructure/web/express/routes/customer.routes.ts
import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
// TODO: import { validationMiddleware } from '../middlewares/validation.middleware';
// import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto'; // Импортируем DTO для ссылки

const router = Router();
const customerController = new CustomerController();

// --- Применяем middleware ко ВСЕМ маршрутам управления клиентами ---
// Доступно только аутентифицированным пользователям с ролью ADMIN или ANALYST
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN', 'ANALYST']));

// --- Маршруты для /api/v1/customers ---

/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Клиенты] # Группируем в Swagger UI
 *     summary: Получить список клиентов пользователя
 *     description: Возвращает список клиентов, связанных с текущим аутентифицированным пользователем, с пагинацией и сортировкой. Доступно ролям ADMIN и ANALYST.
 *     security:
 *       - bearerAuth: [] # Требуется JWT и роль ADMIN/ANALYST
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество клиентов на странице.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, inn] # Допустимые поля для сортировки
 *           default: name
 *         description: Поле для сортировки.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Порядок сортировки.
 *     responses:
 *       '200':
 *         description: Успешный ответ со списком клиентов и информацией для пагинации.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListCustomersResponseDto' # Ссылка на DTO ответа
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', customerController.getAllCustomers);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить клиента по ID
 *     description: Возвращает детальную информацию о конкретном клиенте. Доступно ролям ADMIN и ANALYST. (Примечание: текущая реализация UseCase может не проверять принадлежность клиента пользователю, полагаясь на ACL на уровне запроса или другую логику).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор клиента (ObjectId).
 *           example: 6151f5a0a9a7b1001b1a77a5
 *     responses:
 *       '200':
 *         description: Успешный ответ с данными клиента.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerResponseDto'
 *       '400':
 *         description: Неверный формат ID клиента.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Клиент с указанным ID не найден.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     tags: [Клиенты]
 *     summary: Обновить клиента
 *     description: Обновляет имя и/или контактную информацию существующего клиента, принадлежащего текущему пользователю. Доступно ролям ADMIN и ANALYST.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор клиента для обновления (ObjectId).
 *           example: 6151f5a0a9a7b1001b1a77a5
 *     requestBody:
 *       description: Данные для обновления клиента (хотя бы одно поле должно быть предоставлено).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerDto' # Ссылка на DTO обновления
 *     responses:
 *       '200':
 *         description: Клиент успешно обновлен. Возвращает обновленные данные клиента.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerResponseDto'
 *       '400':
 *         description: Ошибка валидации входных данных или неверный формат ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Клиент с указанным ID не найден или не принадлежит текущему пользователю.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
// TODO: Добавить validationMiddleware(UpdateCustomerDto)
router.put('/:id', customerController.updateCustomer);

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     tags: [Клиенты]
 *     summary: Удалить клиента
 *     description: Удаляет клиента, принадлежащего текущему пользователю. Доступно ролям ADMIN и ANALYST. (Примечание: может потребоваться проверка наличия связанных неоплаченных счетов перед удалением).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор клиента для удаления (ObjectId).
 *           example: 6151f5a0a9a7b1001b1a77a5
 *     responses:
 *       '204':
 *         description: Клиент успешно удален (No Content).
 *       '400':
 *         description: Неверный формат ID или нельзя удалить клиента (например, есть связанные счета).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Клиент с указанным ID не найден или не принадлежит текущему пользователю.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', customerController.deleteCustomer);

export default router;

// --- Напоминание: Определите DTO и стандартные ответы в swagger.config.ts ---
/*
 В вашем файле конфигурации Swagger (например, swagger.config.ts) в разделе `components/schemas`:
   CustomerResponseDto:
     # ... (определение из DTO)
   UpdateCustomerDto:
     # ... (определение из DTO)
   ListCustomersResponseDto:
     # ... (определение из DTO)
   ErrorResponse:
     # ... (определение)

 В разделе `components/responses`:
   UnauthorizedError:
     # ... (определение)
   ForbiddenError:
     # ... (определение)
   InternalServerError:
     # ... (определение)
*/
