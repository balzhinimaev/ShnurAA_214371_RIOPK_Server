"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// src/application/errors/AppError.ts
class AppError extends Error {
    constructor(message, statusCode = 400, isOperational = true) {
        super(message);
        Object.defineProperty(this, "statusCode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isOperational", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Для разделения ожидаемых и неожиданных ошибок (опционально)
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Сохраняем правильный стектрейс (важно для V8)
        Error.captureStackTrace(this, this.constructor);
        // Установка прототипа явно (необходимо для некоторых окружений)
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map