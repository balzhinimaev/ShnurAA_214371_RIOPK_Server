"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = validationMiddleware;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AppError_1 = require("../../../../application/errors/AppError");
/**
 * Форматирует ошибки валидации от class-validator в одну строку для основного сообщения.
 */
function formatValidationErrorsToString(errors) {
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
function validationMiddleware(dtoClass, skipMissingProperties = false) {
    return async (req, _res, next) => {
        const dtoInstance = (0, class_transformer_1.plainToInstance)(dtoClass, req.body);
        const errors = await (0, class_validator_1.validate)(dtoInstance, {
            skipMissingProperties,
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (errors.length > 0) {
            const errorMessage = formatValidationErrorsToString(errors);
            // Создаем AppError
            const error = new AppError_1.AppError(`Ошибка валидации: ${errorMessage}`, 400);
            // Добавляем поле с деталями валидации
            error.validationErrors = errors;
            // Передаем ошибку с деталями дальше
            return next(error);
        }
        req.body = dtoInstance;
        next();
    };
}
//# sourceMappingURL=validation.middleware.js.map