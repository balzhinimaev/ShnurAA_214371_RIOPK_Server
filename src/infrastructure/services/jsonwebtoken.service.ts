// src/infrastructure/services/jsonwebtoken.service.ts
import { injectable } from 'tsyringe';
import * as jwt from 'jsonwebtoken';
import ms, { StringValue } from 'ms';
import config from '../config';
import {
    IJwtService,
    JwtPayload, // Наш кастомный интерфейс
} from '../../application/interfaces/IJwtService';
import { AppError } from '../../application/errors/AppError';

@injectable()
export class JsonWebTokenService implements IJwtService {
    private readonly secret: jwt.Secret = config.jwt.secret;
    private readonly expiresInString: string = config.jwt.expiresIn || '1d';

    // ... (метод sign остается без изменений) ...
    async sign(payload: Pick<JwtPayload, 'sub' | 'roles'>): Promise<string> {
        try {
            const expiresInMs = ms(this.expiresInString as StringValue);

            if (expiresInMs === undefined || isNaN(expiresInMs)) {
                console.error(
                    `Invalid JWT expiresIn format in config: '${this.expiresInString}'.`,
                );
                throw new AppError(
                    'Неверный формат времени жизни JWT в конфигурации.',
                    500,
                );
            }

            const expiresInSeconds = Math.floor(expiresInMs / 1000);
            return this.generateToken(payload, expiresInSeconds);
        } catch (error) {
            console.error('JWT Signing Error:', error);
            throw new AppError(
                `Ошибка подписи JWT: ${error instanceof Error ? error.message : error}`,
                500,
            );
        }
    }

    private generateToken(
        payload: Pick<JwtPayload, 'sub' | 'roles'>,
        expiresInSeconds: number,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const options: jwt.SignOptions = {
                algorithm: 'HS256',
                expiresIn: expiresInSeconds,
                subject: payload.sub,
            };
            const tokenPayload = { roles: payload.roles };
            jwt.sign(tokenPayload, this.secret, options, (err, token) => {
                if (err || !token) {
                    reject(
                        new AppError(
                            `Ошибка генерации токена: ${err?.message || 'неизвестная ошибка'}`,
                            500,
                        ),
                    );
                } else {
                    resolve(token);
                }
            });
        });
    }

    /**
     * Верифицирует JWT токен и возвращает его payload.
     * @param token - Строка JWT токена для проверки.
     * @returns Промис с нашим кастомным JwtPayload если токен валиден, иначе null.
     */
    async verify(token: string): Promise<JwtPayload | null> {
        return new Promise((resolve) => {
            const verifyOptions: jwt.VerifyOptions = {
                algorithms: ['HS256'],
            };

            jwt.verify(token, this.secret, verifyOptions, (err, decoded) => {
                if (err || !decoded) {
                    // Ошибка верификации (истек срок, неверная подпись и т.д.)
                    // if (err) console.warn('JWT Verification failed:', err.message); // Можно логгировать при отладке
                    return resolve(null);
                }

                // --- Начало Type Guard ---
                // 1. Убеждаемся, что decoded - это объект (а не строка, как иногда бывает)
                if (typeof decoded === 'object' && decoded !== null) {
                    // 2. Теперь безопасно проверяем наличие и тип нужных полей
                    //    Используем `as any` или `as Record<string, unknown>` для временного обхода
                    //    строгой типизации перед проверкой полей.
                    const potentialPayload = decoded as Record<string, unknown>;

                    const sub = potentialPayload.sub;
                    const roles = potentialPayload.roles;
                    const iat = potentialPayload.iat;
                    const exp = potentialPayload.exp;

                    if (
                        sub &&
                        typeof sub === 'string' && // Проверяем sub
                        roles &&
                        Array.isArray(roles) &&
                        roles.every((r) => typeof r === 'string') // Проверяем roles
                    ) {
                        // --- Конец Type Guard ---

                        // Все проверки пройдены, создаем объект нашего типа JwtPayload
                        const validPayload: JwtPayload = {
                            sub: sub,
                            roles: roles as string[], // Теперь каст безопасен
                            iat: typeof iat === 'number' ? iat : undefined,
                            exp: typeof exp === 'number' ? exp : undefined,
                        };
                        resolve(validPayload);
                    } else {
                        // Структура объекта не соответствует ожидаемой
                        console.warn(
                            'JWT payload structure mismatch or invalid types after verification:',
                            decoded,
                        );
                        resolve(null);
                    }
                } else {
                    // decoded оказался не объектом (маловероятно для стандартных JWT)
                    console.warn(
                        'JWT decoded value is not an object:',
                        decoded,
                    );
                    resolve(null);
                }
            });
        });
    }
}
