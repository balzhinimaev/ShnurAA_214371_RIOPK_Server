"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
const IJwtService_1 = require("../../../../application/interfaces/IJwtService");
const AppError_1 = require("../../../../application/errors/AppError");
const authMiddleware = async (req, _res, next) => {
    // Пропускаем OPTIONS запросы (CORS preflight) без аутентификации
    if (req.method === 'OPTIONS') {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError_1.AppError('Ошибка аутентификации: токен не предоставлен.', 401));
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(new AppError_1.AppError('Ошибка аутентификации: неверный формат токена.', 401));
    }
    try {
        const jwtService = tsyringe_1.container.resolve(IJwtService_1.JwtServiceToken);
        // Верифицируем токен и получаем payload типа JwtPayload | null
        const payload = await jwtService.verify(token);
        // Проверяем, что payload не null и содержит нужные поля (хотя verify уже должен это делать)
        if (!payload || !payload.sub || !payload.roles) {
            // Проверяем sub
            console.error('[AuthMiddleware] Invalid or missing JWT payload after verification.');
            return next(new AppError_1.AppError('Ошибка аутентификации: недействительный токен (payload).', 401));
        }
        // Добавляем информацию о пользователе в объект запроса
        // Записываем ID пользователя из поля 'sub' в поле 'id' объекта req.user
        req.user = {
            id: payload.sub, // <-- Читаем sub, записываем как id
            roles: payload.roles,
        };
        console.log(`[AuthMiddleware] User authenticated: ${req.user.id}, Roles: [${req.user.roles.join(', ')}]`);
        next();
    }
    catch (error) {
        console.error('[AuthMiddleware] JWT verification or processing failed:', error.message);
        next(new AppError_1.AppError(`Ошибка аутентификации: ${error.message || 'недействительный токен.'}`, 401));
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map