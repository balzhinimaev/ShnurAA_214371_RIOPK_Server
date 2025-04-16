// src/types/express/index.d.ts

// Используем declaration merging для расширения интерфейса Request из Express
declare namespace Express {
    export interface Request {
        user?: {
            id: string; // ID пользователя из JWT
            roles: string[]; // Массив ролей пользователя из JWT
            // Можно добавить другие поля из JWT payload, если нужно (например, email)
            // email?: string;
        };
    }
}
