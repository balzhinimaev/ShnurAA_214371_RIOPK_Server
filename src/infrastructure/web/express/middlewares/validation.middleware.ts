// src/infrastructure/web/express/middlewares/validation.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AppError } from '../../../../application/errors/AppError';

/**
 * Интерфейс для ошибки AppError, дополненной деталями валидации.
 * Используется для передачи информации между validationMiddleware и errorHandler.
 */
export interface AppValidationError extends AppError {
    validationErrors: ValidationError[]; // Массив оригинальных ошибок class-validator
}

/**
 * Форматирует ошибки валидации от class-validator в одну строку для основного сообщения.
 */
function formatValidationErrorsToString(errors: ValidationError[]): string {
    return errors
        .map((err) => {
            if (err.constraints) {
                return Object.values(err.constraints).join(', ');
            }
            if (err.children && err.children.length > 0) {
                return `${err.property}: [${formatValidationErrorsToString(err.children)}]`;
            }
            return `Unknown validation error for property: ${err.property}`;
        })
        .join('; ');
}

/**
 * Middleware для валидации тела запроса (req.body) с использованием DTO.
 * @param dtoClass Класс DTO, который нужно использовать для валидации.
 * @param skipMissingProperties Пропускать ли проверку отсутствующих свойств (по умолчанию false).
 */
export function validationMiddleware<T extends object>(
    dtoClass: ClassConstructor<T>,
    skipMissingProperties = false,
): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const dtoInstance = plainToInstance(dtoClass, req.body);

        const errors = await validate(dtoInstance, {
            skipMissingProperties,
            whitelist: true,
            forbidNonWhitelisted: true,
        });

        if (errors.length > 0) {
            const errorMessage = formatValidationErrorsToString(errors);
            // Создаем AppError
            const error = new AppError(
                `Ошибка валидации: ${errorMessage}`,
                400,
            ) as AppValidationError;
            // Добавляем поле с деталями валидации
            error.validationErrors = errors;
            // Передаем ошибку с деталями дальше
            return next(error);
        }

        req.body = dtoInstance;
        next();
    };
}
