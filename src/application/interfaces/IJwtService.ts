// src/application/interfaces/IJwtService.ts

export interface JwtPayload {
    sub: string; // Subject (user ID) - Используем sub!
    roles: string[]; // Роли пользователя
    // Можно добавить стандартные поля JWT, если они нужны
    iat?: number; // Issued At
    exp?: number; // Expiration Time
}

export interface IJwtService {
    // Изменяем sign, чтобы он принимал только то, что нужно для создания токена
    sign(payload: Pick<JwtPayload, 'sub' | 'roles'>): Promise<string>;
    verify(token: string): Promise<JwtPayload | null>; // verify возвращает полный payload
}

export const JwtServiceToken = Symbol('IJwtService');