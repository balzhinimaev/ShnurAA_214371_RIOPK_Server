// src/infrastructure/web/express/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../../application/errors/AppError';
import config from '../../../config'; // Для проверки окружения

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction, // next обязательно должен быть здесь, даже если не используется, чтобы Express понял, что это error handler
): void {
    // Указываем void, т.к. он должен завершать запрос-ответ
    console.error('Error Handler caught an error:', err); // Логируем ошибку для отладки

    if (err instanceof AppError) {
        // Если это наша ожидаемая ошибка AppError
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            // Можно добавить доп. поля, если нужно
        });
    } else {
        // Если это непредвиденная ошибка (ошибка сервера)
        // В production не стоит отправлять детали ошибки клиенту
        const statusCode = 500;
        const message =
            config.env === 'production'
                ? 'Internal Server Error'
                : `Internal Server Error: ${err.message}`; // В dev можно показать детали

        res.status(statusCode).json({
            status: 'fail',
            message: message,
            // В режиме разработки можно добавить и stack trace
            ...(config.env !== 'production' && { stack: err.stack }),
        });
    }
}
