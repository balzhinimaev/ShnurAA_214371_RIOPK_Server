// src/infrastructure/web/express/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe'; // Импортируем DI контейнер
import { RegisterUserUseCase } from '../../../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../../../application/use-cases/auth/login-user.use-case';
import { RegisterUserDto } from '../../../../application/dtos/auth/register-user.dto'; // Импортируем DTO
import { LoginUserDto } from '../../../../application/dtos/auth/login-user.dto';
import { plainToInstance } from 'class-transformer'; // Для преобразования req.body в DTO
import { validate } from 'class-validator'; // Для валидации DTO вручную (если не используем middleware)
import { AppError } from '../../../../application/errors/AppError';
import { IUserRepository, UserRepositoryToken } from '../../../../domain/repositories/IUserRepository';
import { UserResponseDto } from '../../../../application/dtos/auth/user-response.dto';

// Хотя контроллер можно сделать @injectable, для Express проще
// инстанцировать его напрямую или разрешать Use Cases внутри методов.
// Мы будем разрешать Use Cases через `container.resolve`.

export class AuthController {
    /**
     * Обрабатывает запрос на регистрацию пользователя.
     */
    async register(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // 1. Получаем Use Case из DI контейнера
        const registerUserUseCase = container.resolve(RegisterUserUseCase);

        // 2. Преобразуем req.body в DTO и валидируем (лучше делать в middleware)
        const registerUserDto = plainToInstance(RegisterUserDto, req.body);
        const errors = await validate(registerUserDto);

        if (errors.length > 0) {
            // Если есть ошибки валидации, передаем их дальше (в error handler)
            // Можно сформировать более детальную ошибку
            // Мы создадим middleware для этого позже
            return next(new Error(`Validation failed: ${errors}`));
        }

        try {
            // 3. Выполняем Use Case
            const userResponse =
                await registerUserUseCase.execute(registerUserDto);

            // 4. Отправляем успешный ответ
            // Используем статус 201 Created для успешной регистрации
            res.status(201).json(userResponse);
        } catch (error) {
            // 5. Передаем ошибку (включая AppError из Use Case) в обработчик ошибок Express
            next(error);
        }
    }

    /**
     * Обрабатывает запрос на вход пользователя.
     */
    async login(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // 1. Получаем Use Case
        const loginUserUseCase = container.resolve(LoginUserUseCase);

        // 2. Валидация DTO (лучше делать в middleware)
        const loginUserDto = plainToInstance(LoginUserDto, req.body);
        const errors = await validate(loginUserDto);
        if (errors.length > 0) {
            return next(new Error(`Validation failed: ${errors}`));
        }

        try {
            // 3. Выполняем Use Case
            const loginResponse = await loginUserUseCase.execute(loginUserDto);

            // 4. Отправляем успешный ответ
            res.status(200).json(loginResponse);
        } catch (error) {
            // 5. Передаем ошибку в обработчик
            next(error);
        }
    }

    /**
     * Обрабатывает запрос на получение информации о текущем пользователе (заглушка).
     * Потребует auth middleware для получения данных пользователя из req.
     */
    async getMe(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // req.user должен быть заполнен authMiddleware (это JwtPayload)
        const userId = req.user?.sub;

        if (!userId) {
            // Этого не должно случиться, если authMiddleware отработал правильно
            return next(
                new AppError('ID пользователя не найден в токене', 401),
            );
        }

        try {
            // Получаем репозиторий для поиска пользователя
            const userRepository =
                container.resolve<IUserRepository>(UserRepositoryToken);
            const user = await userRepository.findById(userId);

            if (!user) {
                // Если пользователь из токена не найден в БД
                return next(new AppError('Пользователь не найден', 404));
            }

            // Преобразуем найденного пользователя в DTO для ответа
            const userResponse = plainToInstance(UserResponseDto, user, {
                excludeExtraneousValues: true,
            });

            res.status(200).json(userResponse);
        } catch (error) {
            next(error); // Передаем ошибки дальше
        }
    }
}
