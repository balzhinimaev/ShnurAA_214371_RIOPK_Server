// src/infrastructure/web/express/middlewares/validation.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer'; // Импортируем ClassConstructor
import { validate, ValidationError } from 'class-validator';
import { AppError } from '../../../../application/errors/AppError';

/**
 * Форматирует ошибки валидации от class-validator в удобную строку или объект.
 */
function formatValidationErrors(errors: ValidationError[]): string {
    return errors
        .map((err) => {
            // Object.values(err.constraints) вернет массив сообщений об ошибках для данного поля
            if (err.constraints) {
                return Object.values(err.constraints).join(', ');
            }
            // Обработка вложенных ошибок (если нужно)
            if (err.children && err.children.length > 0) {
                return `${err.property}: [${formatValidationErrors(err.children)}]`;
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
export function validationMiddleware<T extends object>( // Указываем, что T должен быть объектом
    dtoClass: ClassConstructor<T>, // Используем ClassConstructor для типа класса
    skipMissingProperties = false,
): RequestHandler {
    // Возвращаем тип RequestHandler для ясности
    return async (req: Request, _res: Response, next: NextFunction) => {
        // 1. Преобразуем plain object (req.body) в экземпляр класса DTO
        const dtoInstance = plainToInstance(dtoClass, req.body);

        // 2. Валидируем экземпляр DTO
        const errors = await validate(dtoInstance, {
            skipMissingProperties, // Не требовать наличия всех полей DTO в req.body
            whitelist: true, // Удалять свойства, не описанные в DTO
            forbidNonWhitelisted: true, // Запрещать свойства, не описанные в DTO (выдавать ошибку)
        });

        // 3. Если есть ошибки, форматируем их и передаем в обработчик ошибок
        if (errors.length > 0) {
            const errorMessage = formatValidationErrors(errors);
            // Используем AppError со статусом 400 Bad Request
            return next(new AppError(`Ошибка валидации: ${errorMessage}`, 400));
        }

        // 4. Если ошибок нет, заменяем req.body на валидированный и трансформированный DTO
        // Это удобно, т.к. контроллер получит уже типизированный объект с примененными @Transform и т.д.
        req.body = dtoInstance;
        next(); // Передаем управление следующему middleware
    };
}
