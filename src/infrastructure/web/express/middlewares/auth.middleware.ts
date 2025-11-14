// src/infrastructure/web/express/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import {
    IJwtService,
    JwtServiceToken,
    JwtPayload, // Импортируем JwtPayload
} from '../../../../application/interfaces/IJwtService';
import { AppError } from '../../../../application/errors/AppError';

export const authMiddleware = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    // Пропускаем OPTIONS запросы (CORS preflight) без аутентификации
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new AppError('Ошибка аутентификации: токен не предоставлен.', 401),
        );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(
            new AppError('Ошибка аутентификации: неверный формат токена.', 401),
        );
    }

    try {
        const jwtService = container.resolve<IJwtService>(JwtServiceToken);
        // Верифицируем токен и получаем payload типа JwtPayload | null
        const payload: JwtPayload | null = await jwtService.verify(token);

        // Проверяем, что payload не null и содержит нужные поля (хотя verify уже должен это делать)
        if (!payload || !payload.sub || !payload.roles) {
            // Проверяем sub
            console.error(
                '[AuthMiddleware] Invalid or missing JWT payload after verification.',
            );
            return next(
                new AppError(
                    'Ошибка аутентификации: недействительный токен (payload).',
                    401,
                ),
            );
        }

        // Добавляем информацию о пользователе в объект запроса
        // Записываем ID пользователя из поля 'sub' в поле 'id' объекта req.user
        req.user = {
            id: payload.sub, // <-- Читаем sub, записываем как id
            roles: payload.roles,
        };

        console.log(
            `[AuthMiddleware] User authenticated: ${req.user.id}, Roles: [${req.user.roles.join(', ')}]`,
        );

        next();
    } catch (error: any) {
        console.error(
            '[AuthMiddleware] JWT verification or processing failed:',
            error.message,
        );
        next(
            new AppError(
                `Ошибка аутентификации: ${error.message || 'недействительный токен.'}`,
                401,
            ),
        );
    }
};
