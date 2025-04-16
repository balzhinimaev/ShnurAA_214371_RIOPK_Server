"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
// TODO: Раскомментировать, когда будет создан middleware для валидации DTO
// import { validationMiddleware } from '../middlewares/validation.middleware';
// import { UpdateUserDto } from '../../../../application/dtos/users/update-user.dto';
// TODO: Раскомментировать, когда будет создан DTO для создания пользователя админом
// import { CreateUserByAdminDto } from '../../../../application/dtos/users/create-user-admin.dto';
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// --- Применяем middleware ко ВСЕМ маршрутам управления пользователями ---
// Все операции доступны только аутентифицированным администраторам
router.use(auth_middleware_1.authMiddleware); // 1. Проверка JWT токена
router.use((0, role_middleware_1.roleMiddleware)(['ADMIN'])); // 2. Проверка роли ADMIN
// --- Маршруты ---
/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Пользователи (Admin)]
 *     summary: Получить список пользователей
 *     description: Возвращает список всех пользователей с пагинацией и возможностью сортировки. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество пользователей на странице.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение (количество пропускаемых пользователей) для пагинации.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, email]
 *           default: createdAt
 *         description: Поле для сортировки.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Порядок сортировки (по возрастанию или убыванию).
 *     responses:
 *       '200':
 *         description: Успешный ответ со списком пользователей и информацией для пагинации.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponseDto'
 *                 total:
 *                   type: integer
 *                   description: Общее количество пользователей в системе.
 *                 offset:
 *                   type: integer
 *                   description: Примененное смещение.
 *                 limit:
 *                   type: integer
 *                   description: Примененный лимит.
 *               required: [users, total, offset, limit]
 *               example:
 *                 users:
 *                   - id: "60d0fe4f5311236168a109ca"
 *                     name: "Иван Иванов"
 *                     email: "ivan.ivanov@example.com"
 *                     roles: ["ANALYST"]
 *                     createdAt: "2023-01-01T10:00:00.000Z"
 *                     updatedAt: "2023-01-01T12:30:00.000Z"
 *                   - id: "60d0fe4f5311236168a109cb"
 *                     name: "Администратор Системы"
 *                     email: "admin@example.com"
 *                     roles: ["ADMIN"]
 *                     createdAt: "2023-01-01T09:00:00.000Z"
 *                     updatedAt: "2023-01-02T15:00:00.000Z"
 *                 total: 25
 *                 offset: 0
 *                 limit: 10
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', userController.getAllUsers);
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Пользователи (Admin)]
 *     summary: Получить пользователя по ID
 *     description: Возвращает детальную информацию о конкретном пользователе. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор пользователя (ObjectId).
 *           example: 60d0fe4f5311236168a109ca
 *     responses:
 *       '200':
 *         description: Успешный ответ с данными пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseDto'
 *       '400':
 *         description: Неверный формат ID пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Пользователь с указанным ID не найден.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', userController.getUserById);
/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Пользователи (Admin)]
 *     summary: Обновить пользователя
 *     description: Обновляет имя и/или роли существующего пользователя. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор пользователя для обновления (ObjectId).
 *           example: 60d0fe4f5311236168a109ca
 *     requestBody:
 *       description: Данные для обновления пользователя (хотя бы одно поле должно быть предоставлено).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       '200':
 *         description: Пользователь успешно обновлен. Возвращает обновленные данные пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseDto'
 *       '400':
 *         description: Ошибка валидации входных данных (неверные роли, слишком короткое имя и т.д.) или неверный формат ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Пользователь с указанным ID не найден для обновления.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
// TODO: Добавить validationMiddleware(UpdateUserDto)
router.put('/:id', userController.updateUser);
/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Пользователи (Admin)]
 *     summary: Удалить пользователя
 *     description: Удаляет пользователя из системы. Нельзя удалить свою учетную запись. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Уникальный идентификатор пользователя для удаления (ObjectId).
 *           example: 60d0fe4f5311236168a109ca
 *     responses:
 *       '204':
 *         description: Пользователь успешно удален (No Content).
 *       '400':
 *         description: Нельзя удалить свою учетную запись или неверный формат ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Пользователь с указанным ID не найден для удаления.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', userController.deleteUser);
// --- Опциональный маршрут создания пользователя админом ---
/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Пользователи (Admin)]
 *     summary: Создать нового пользователя (Администратором)
 *     description: Создает нового пользователя с указанием имени, email, пароля и ролей. Пароль должен быть предоставлен в открытом виде. Доступно только администраторам.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Данные для создания нового пользователя.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # TODO: Заменить на $ref: '#/components/schemas/CreateUserByAdminDto' после создания DTO
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Сергей Петров"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sergey.petrov@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль в открытом виде (будет хеширован на сервере). Минимум 6 символов.
 *                 example: "Str0ngP@ssw0rd"
 *                 minLength: 6
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ADMIN, ANALYST, MANAGER]
 *                 example: ["ANALYST"]
 *             required: [name, email, password, roles]
 *     responses:
 *       '201':
 *         description: Пользователь успешно создан. Возвращает данные созданного пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseDto'
 *       '400':
 *         description: Ошибка валидации входных данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' # Или детальная ошибка валидации
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '409':
 *         description: Пользователь с таким Email уже существует.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
// TODO: Раскомментировать, реализовать UseCase, DTO и validationMiddleware
// router.post('/', userController.createUserByAdmin);
exports.default = router;
// --- Напоминание: Определите стандартные ответы и схемы в swagger.config.ts ---
/*
 В вашем файле конфигурации Swagger (например, swagger.config.ts) в разделе `components`:
 components:
   schemas:
     UserResponseDto: # Ссылка на ваш UserResponseDto
        # ... (определение как в вашем DTO)
     UpdateUserDto: # Ссылка на ваш UpdateUserDto
        # ... (определение как в вашем DTO)
     # CreateUserByAdminDto: # TODO: Определить DTO для создания пользователя админом
     ErrorResponse: # Общая схема ошибки
       type: object
       properties:
         message:
           type: string
           description: Сообщение об ошибке.
           example: "Пользователь не найден"
         status:
           type: string
           example: error
         statusCode: # Опционально
           type: integer
           example: 404
       required: [message]

   responses: # Стандартные ответы для многократного использования
     UnauthorizedError:
       description: Ошибка аутентификации (401).
       content:
         application/json:
           schema:
             $ref: '#/components/schemas/ErrorResponse'
     ForbiddenError:
       description: Доступ запрещен (403).
       content:
         application/json:
           schema:
             $ref: '#/components/schemas/ErrorResponse'
     InternalServerError:
       description: Внутренняя ошибка сервера (500).
       content:
         application/json:
           schema:
             $ref: '#/components/schemas/ErrorResponse'

   securitySchemes: # Определение схемы аутентификации
       bearerAuth:
         type: http
         scheme: bearer
         bearerFormat: JWT
*/
//# sourceMappingURL=user.routes.js.map