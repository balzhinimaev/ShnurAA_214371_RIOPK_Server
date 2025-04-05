// src/application/errors/AppError.ts
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean; // Для разделения ожидаемых и неожиданных ошибок (опционально)

    constructor(
        message: string,
        statusCode: number = 400,
        isOperational: boolean = true,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Сохраняем правильный стектрейс (важно для V8)
        Error.captureStackTrace(this, this.constructor);

        // Установка прототипа явно (необходимо для некоторых окружений)
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
