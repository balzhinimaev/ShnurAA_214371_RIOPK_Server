"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const tsyringe_1 = require("tsyringe"); // Импортируем DI контейнер
const register_user_use_case_1 = require("../../../../application/use-cases/auth/register-user.use-case");
const login_user_use_case_1 = require("../../../../application/use-cases/auth/login-user.use-case");
const register_user_dto_1 = require("../../../../application/dtos/auth/register-user.dto"); // Импортируем DTO
const login_user_dto_1 = require("../../../../application/dtos/auth/login-user.dto");
const class_transformer_1 = require("class-transformer"); // Для преобразования req.body в DTO
const class_validator_1 = require("class-validator"); // Для валидации DTO вручную (если не используем middleware)
const AppError_1 = require("../../../../application/errors/AppError");
const IUserRepository_1 = require("../../../../domain/repositories/IUserRepository");
const user_response_dto_1 = require("../../../../application/dtos/auth/user-response.dto");
// Хотя контроллер можно сделать @injectable, для Express проще
// инстанцировать его напрямую или разрешать Use Cases внутри методов.
// Мы будем разрешать Use Cases через `container.resolve`.
class AuthController {
    /**
     * Обрабатывает запрос на регистрацию пользователя.
     */
    async register(req, res, next) {
        // 1. Получаем Use Case из DI контейнера
        const registerUserUseCase = tsyringe_1.container.resolve(register_user_use_case_1.RegisterUserUseCase);
        // 2. Преобразуем req.body в DTO и валидируем (лучше делать в middleware)
        const registerUserDto = (0, class_transformer_1.plainToInstance)(register_user_dto_1.RegisterUserDto, req.body);
        const errors = await (0, class_validator_1.validate)(registerUserDto);
        if (errors.length > 0) {
            // Если есть ошибки валидации, передаем их дальше (в error handler)
            // Можно сформировать более детальную ошибку
            // Мы создадим middleware для этого позже
            return next(new Error(`Validation failed: ${errors}`));
        }
        try {
            // 3. Выполняем Use Case
            const userResponse = await registerUserUseCase.execute(registerUserDto);
            // 4. Отправляем успешный ответ
            // Используем статус 201 Created для успешной регистрации
            res.status(201).json(userResponse);
        }
        catch (error) {
            // 5. Передаем ошибку (включая AppError из Use Case) в обработчик ошибок Express
            next(error);
        }
    }
    /**
     * Обрабатывает запрос на вход пользователя.
     */
    async login(req, res, next) {
        // 1. Получаем Use Case
        const loginUserUseCase = tsyringe_1.container.resolve(login_user_use_case_1.LoginUserUseCase);
        // 2. Валидация DTO (лучше делать в middleware)
        const loginUserDto = (0, class_transformer_1.plainToInstance)(login_user_dto_1.LoginUserDto, req.body);
        const errors = await (0, class_validator_1.validate)(loginUserDto);
        if (errors.length > 0) {
            return next(new Error(`Validation failed: ${errors}`));
        }
        try {
            // 3. Выполняем Use Case
            const loginResponse = await loginUserUseCase.execute(loginUserDto);
            // 4. Отправляем успешный ответ
            res.status(200).json(loginResponse);
        }
        catch (error) {
            // 5. Передаем ошибку в обработчик
            next(error);
        }
    }
    /**
     * Обрабатывает запрос на получение информации о текущем пользователе (заглушка).
     * Потребует auth middleware для получения данных пользователя из req.
     */
    async getMe(req, res, next) {
        // req.user должен быть заполнен authMiddleware и содержать поля id и roles
        // --- ИСПРАВЛЕНИЕ ---
        const userId = req.user?.id; // <-- Читаем поле 'id', которое установил authMiddleware
        if (!userId) {
            // Эта ситуация не должна возникать, если authMiddleware отработал правильно
            // и установил req.user
            console.error('[AuthController.getMe] req.user or req.user.id is undefined. Auth middleware might have failed.');
            return next(new AppError_1.AppError('Ошибка аутентификации: не удалось определить пользователя.', 401));
        }
        try {
            // Получаем репозиторий для поиска пользователя
            const userRepository = tsyringe_1.container.resolve(IUserRepository_1.UserRepositoryToken);
            // Ищем пользователя по ID, полученному из req.user.id
            const user = await userRepository.findById(userId);
            if (!user) {
                // Если пользователь из токена не найден в БД (возможно, удален)
                console.warn(`[AuthController.getMe] User with ID ${userId} from token not found in DB.`);
                return next(new AppError_1.AppError('Пользователь не найден', 404));
            }
            // Преобразуем найденного пользователя в DTO для ответа
            const userResponse = (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
                excludeExtraneousValues: true, // Убираем лишние поля (например, passwordHash)
            });
            res.status(200).json(userResponse);
        }
        catch (error) {
            console.error(`[AuthController.getMe] Error fetching user ${userId}:`, error);
            next(error); // Передаем ошибки дальше
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map