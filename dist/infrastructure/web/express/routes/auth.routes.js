"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const register_user_dto_1 = require("../../../../application/dtos/auth/register-user.dto");
const login_user_dto_1 = require("../../../../application/dtos/auth/login-user.dto");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Аутентификация]
 *     summary: Регистрация нового пользователя
 *     description: Создает нового пользователя в системе.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserDto' # Ссылка на DTO
 *     responses:
 *       201:
 *         description: Пользователь успешно создан.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseDto' # Ссылка на DTO ответа
 *       400:
 *         description: Ошибка валидации входных данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Конфликт - пользователь с таким email уже существует.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: [] # Этот эндпоинт публичный, переопределяем глобальную безопасность
 */
router.post('/register', (0, validation_middleware_1.validationMiddleware)(register_user_dto_1.RegisterUserDto), authController.register);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Аутентификация]
 *     summary: Вход пользователя в систему
 *     description: Аутентифицирует пользователя и возвращает JWT токен.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserDto'
 *     responses:
 *       200:
 *         description: Успешный вход.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponseDto'
 *       400:
 *         description: Ошибка валидации входных данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Ошибка аутентификации (неверный email или пароль).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: [] # Этот эндпоинт публичный
 */
router.post('/login', (0, validation_middleware_1.validationMiddleware)(login_user_dto_1.LoginUserDto), authController.login);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Аутентификация]
 *     summary: Получение данных текущего пользователя
 *     description: Возвращает информацию об аутентифицированном пользователе на основе JWT токена.
 *     security:
 *       - bearerAuth: [] # Указываем, что требуется JWT Bearer токен
 *     responses:
 *       200:
 *         description: Данные пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseDto'
 *       401:
 *         description: Ошибка авторизации (токен отсутствует, невалиден или истек).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *          description: Пользователь не найден (если ID из токена не найден в БД).
 *          content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', auth_middleware_1.authMiddleware, authController.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map