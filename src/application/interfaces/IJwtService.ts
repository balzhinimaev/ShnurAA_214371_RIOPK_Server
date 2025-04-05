// src/application/interfaces/IJwtService.ts
export interface JwtPayload {
    sub: string; // Subject (user ID)
    roles: string[]; // Роли пользователя
    // Можно добавить другие поля, например, email
}
export interface IJwtService {
    sign(payload: JwtPayload): Promise<string>;
    verify(token: string): Promise<JwtPayload | null>;
}
export const JwtServiceToken = Symbol('IJwtService');