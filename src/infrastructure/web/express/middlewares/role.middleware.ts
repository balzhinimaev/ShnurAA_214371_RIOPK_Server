// src/infrastructure/web/express/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../../application/errors/AppError';

/**
 * Фабрика Middleware для проверки ролей пользователя.
 * Принимает массив разрешенных ролей и возвращает Express middleware.
 * Middleware проверяет, содержит ли req.user.roles хотя бы одну из разрешенных ролей.
 * Предполагается, что authMiddleware уже отработал и добавил req.user.
 *
 * @param allowedRoles - Массив строк с названиями ролей, которым разрешен доступ.
 * @returns Express middleware function.
 */
export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        // 1. Проверяем, был ли пользователь аутентифицирован и его данные добавлены в req
        if (!req.user) {
            // Эта ситуация не должна возникать, если authMiddleware отработал корректно,
            // но лучше перестраховаться. Это может указывать на ошибку конфигурации.
            console.error(
                '[RoleMiddleware] Error: req.user is not defined. Ensure authMiddleware runs first and sets req.user.',
            );
            return next(
                new AppError(
                    'Ошибка аутентификации: пользователь не определен.',
                    500,
                ), // 500 т.к. это внутренняя ошибка скорее всего
            );
        }

        // 2. Проверяем, есть ли у пользователя поле roles и является ли оно массивом
        if (!req.user.roles || !Array.isArray(req.user.roles)) {
            console.error(
                '[RoleMiddleware] Error: req.user.roles is missing or not an array. User ID:',
                req.user.id,
            );
            // Пользователь аутентифицирован, но информация о ролях некорректна
            return next(
                new AppError(
                    'Ошибка авторизации: не удалось определить роли пользователя.',
                    403,
                ),
            );
        }

        // 3. Проверяем наличие хотя бы одной разрешенной роли у пользователя
        const userRoles: string[] = req.user.roles;
        const hasPermission = userRoles.some((role) =>
            allowedRoles.includes(role),
        );

        if (hasPermission) {
            // У пользователя есть необходимая роль, пропускаем дальше
            next();
        } else {
            // У пользователя нет прав доступа
            console.warn(
                `[RoleMiddleware] Forbidden access for user ${req.user.id} to ${req.originalUrl}. User roles: [${userRoles.join(', ')}], Allowed roles: [${allowedRoles.join(', ')}]`,
            );
            next(
                new AppError('Доступ запрещен: недостаточно прав.', 403), // 403 Forbidden
            );
        }
    };
};
