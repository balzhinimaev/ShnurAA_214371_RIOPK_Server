// src/infrastructure/web/express/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator'; // Импортируем, чтобы использовать тип
import { AppError } from '../../../../application/errors/AppError';
import { AppValidationError } from './validation.middleware'; // Импортируем наш интерфейс
import config from '../../../config';

/**
 * Извлекает все сообщения об ошибках из массива ValidationError[] в плоский массив строк.
 */
function extractErrorMessages(errors: ValidationError[]): string[] {
    let messages: string[] = [];
    errors.forEach((err) => {
        if (err.constraints) {
            messages = messages.concat(Object.values(err.constraints));
        }
        if (err.children && err.children.length > 0) {
            messages = messages.concat(extractErrorMessages(err.children));
        }
    });
    return messages;
}

export function errorHandler(
    err: Error | AppError, // Ожидаем Error или наш AppError
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): void {
    console.error('Error Handler caught an error:', err);

    let statusCode = 500;
    // Базовая структура ответа
    let responseBody: {
        status: string;
        message: string;
        errors?: string[];
        stack?: string;
    } = {
        status: 'error',
        message: 'Internal Server Error',
    };

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        responseBody.message = err.message; // Используем сообщение из AppError

        // Проверяем, содержит ли ошибка детали валидации
        // Используем 'as' и проверку наличия свойства validationErrors
        const validationError = err as AppValidationError;
        if (
            validationError.validationErrors &&
            Array.isArray(validationError.validationErrors)
        ) {
            // Если это ошибка валидации, формируем поле 'errors'
            responseBody.errors = extractErrorMessages(
                validationError.validationErrors,
            );
            // Можно установить более специфичное сообщение
            responseBody.message = 'Обнаружены ошибки валидации';
            responseBody.status = 'fail'; // Часто для ошибок валидации используют 'fail'
        } else {
            // Для других AppError (не валидационных)
            responseBody.status = statusCode >= 500 ? 'error' : 'fail';
        }

        // Добавляем stack trace только в dev режиме и для НЕОЖИДАННЫХ AppError
        if (config.env === 'development' && !err.isOperational && err.stack) {
            responseBody.stack = err.stack;
        }
    } else {
        // Неизвестная ошибка сервера
        responseBody.status = 'error';
        responseBody.message =
            config.env === 'production'
                ? 'Internal Server Error'
                : `Internal Server Error: ${err.message}`;

        if (config.env !== 'production' && err.stack) {
            responseBody.stack = err.stack;
        }
    }

    // Отправляем ответ
    res.status(statusCode).json(responseBody);
}
