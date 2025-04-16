"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../../../../application/errors/AppError");
const config_1 = __importDefault(require("../../../config"));
/**
 * Извлекает все сообщения об ошибках из массива ValidationError[] в плоский массив строк.
 */
function extractErrorMessages(errors) {
    let messages = [];
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
function errorHandler(err, // Ожидаем Error или наш AppError
_req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error('Error Handler caught an error:', err);
    let statusCode = 500;
    // Базовая структура ответа
    let responseBody = {
        status: 'error',
        message: 'Internal Server Error',
    };
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        responseBody.message = err.message; // Используем сообщение из AppError
        // Проверяем, содержит ли ошибка детали валидации
        // Используем 'as' и проверку наличия свойства validationErrors
        const validationError = err;
        if (validationError.validationErrors &&
            Array.isArray(validationError.validationErrors)) {
            // Если это ошибка валидации, формируем поле 'errors'
            responseBody.errors = extractErrorMessages(validationError.validationErrors);
            // Можно установить более специфичное сообщение
            responseBody.message = 'Обнаружены ошибки валидации';
            responseBody.status = 'fail'; // Часто для ошибок валидации используют 'fail'
        }
        else {
            // Для других AppError (не валидационных)
            responseBody.status = statusCode >= 500 ? 'error' : 'fail';
        }
        // Добавляем stack trace только в dev режиме и для НЕОЖИДАННЫХ AppError
        if (config_1.default.env === 'development' && !err.isOperational && err.stack) {
            responseBody.stack = err.stack;
        }
    }
    else {
        // Неизвестная ошибка сервера
        responseBody.status = 'error';
        responseBody.message =
            config_1.default.env === 'production'
                ? 'Internal Server Error'
                : `Internal Server Error: ${err.message}`;
        if (config_1.default.env !== 'production' && err.stack) {
            responseBody.stack = err.stack;
        }
    }
    // Отправляем ответ
    res.status(statusCode).json(responseBody);
}
//# sourceMappingURL=error.middleware.js.map