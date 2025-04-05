// src/infrastructure/web/express/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AppError } from '../../../../application/errors/AppError';
import {
    IJwtService,
    JwtServiceToken,
    JwtPayload,
} from '../../../../application/interfaces/IJwtService';
// import { IUserRepository, UserRepositoryToken } from '../../../../domain/repositories/IUserRepository'; // Раскомментировать, если нужна проверка существования user ID из токена

// Расширяем интерфейс Request Express, чтобы добавить свойство user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; // Добавляем опциональное свойство user типа JwtPayload
        }
    }
}

export async function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    // 1. Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new AppError(
                'Отсутствует или неверный формат токена авторизации',
                401,
            ),
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Получаем сервис JWT из DI контейнера
        const jwtService = container.resolve<IJwtService>(JwtServiceToken);

        // 3. Верифицируем токен
        const payload = await jwtService.verify(token);

        if (!payload) {
            return next(new AppError('Невалидный или истекший токен', 401));
        }

        // 4. (Опционально, но рекомендуется) Проверяем, существует ли пользователь с таким ID в БД
        // Это защищает от случаев, когда токен еще валиден, но пользователь был удален
        // const userRepository = container.resolve<IUserRepository>(UserRepositoryToken);
        // const userExists = await userRepository.findById(payload.sub);
        // if (!userExists) {
        //     return next(new AppError('Пользователь, связанный с токеном, не найден', 401));
        // }

        // 5. Добавляем payload (данные пользователя из токена) в объект запроса
        req.user = payload;

        // 6. Передаем управление следующему middleware или обработчику роута
        next();
    } catch (error) {
        // Обрабатываем возможные ошибки верификации или другие проблемы
        // Ошибки от jwtService.verify уже обработаны (вернет null), ловим остальные
        console.error('Auth Middleware Error:', error);
        next(new AppError('Ошибка авторизации', 401));
    }
}
