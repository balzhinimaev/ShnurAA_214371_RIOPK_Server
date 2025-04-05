// src/infrastructure/services/jsonwebtoken.service.ts
import { injectable } from 'tsyringe';
import * as jwt from 'jsonwebtoken';
import ms, { StringValue } from 'ms'; // Импортируем ms и тип StringValue
import config from '../config'; // Наша конфигурация
import {
    IJwtService,
    JwtPayload,
} from '../../application/interfaces/IJwtService'; // Интерфейс и тип Payload

@injectable() // Делаем класс доступным для Dependency Injection
export class JsonWebTokenService implements IJwtService {
    // Типизируем секрет для ясности
    private readonly secret: jwt.Secret = config.jwt.secret;
    // Храним исходную строку времени жизни из конфига
    private readonly expiresInString: string = config.jwt.expiresIn || '1d'; // Используем '1d' как fallback

    /**
     * Генерирует JWT токен.
     * @param payload - Данные для включения в токен (ID пользователя, роли).
     * @returns Промис со строкой JWT токена.
     */
    async sign(payload: JwtPayload): Promise<string> {
        try {
            // 1. Преобразуем строку времени жизни в миллисекунды, УТВЕРЖДАЯ ТИП
            const expiresInMs = ms(this.expiresInString as StringValue); // <-- Используем 'as StringValue'

            // 2. Проверяем результат преобразования (ms вернет undefined при неверном формате)
            if (expiresInMs === undefined || isNaN(expiresInMs)) {
                console.error(
                    `Invalid JWT expiresIn format in config: '${this.expiresInString}'. Using default '1d'.`,
                );
                // Можно использовать дефолтное значение или выбросить ошибку, если критично
                // throw new Error('Invalid JWT expiration configuration');
                // В данном случае, попробуем с дефолтным '1d'
                const defaultExpiresInMs = ms('1d' as StringValue);
                if (defaultExpiresInMs === undefined) {
                    // Этого не должно случиться, но на всякий случай
                    throw new Error(
                        'Could not parse default JWT expiration "1d"',
                    );
                }
                // Пересчитываем секунды для дефолтного значения
                const expiresInSeconds = Math.floor(defaultExpiresInMs / 1000);
                return this.generateToken(payload, expiresInSeconds);
            }

            // 3. Получаем секунды из миллисекунд
            const expiresInSeconds = Math.floor(expiresInMs / 1000);

            // 4. Генерируем токен
            return this.generateToken(payload, expiresInSeconds);
        } catch (error) {
            // Ловим любые ошибки (от ms или jwt.sign)
            console.error('JWT Signing Error:', error);
            // Перебрасываем ошибку или возвращаем Promise.reject
            return Promise.reject(
                error instanceof Error
                    ? error
                    : new Error('JWT signing failed'),
            );
        }
    }

    // Вспомогательный метод для генерации токена (чтобы избежать дублирования)
    private generateToken(
        payload: JwtPayload,
        expiresInSeconds: number,
    ): Promise<string> {
        const options: jwt.SignOptions = {
            algorithm: 'HS256', // Явно указываем алгоритм
            expiresIn: expiresInSeconds, // Передаем время жизни в секундах (number)
        };
        const token = jwt.sign(payload, this.secret, options);
        return Promise.resolve(token); // Возвращаем успешный промис
    }

    /**
     * Верифицирует JWT токен и возвращает его payload.
     * @param token - Строка JWT токена для проверки.
     * @returns Промис с JwtPayload если токен валиден, иначе null.
     */
    async verify(token: string): Promise<JwtPayload | null> {
        return new Promise((resolve) => {
            // Опции верификации с указанием ожидаемого алгоритма
            const verifyOptions: jwt.VerifyOptions = {
                algorithms: ['HS256'],
            };

            jwt.verify(token, this.secret, verifyOptions, (err, decoded) => {
                // Ошибка верификации (неверная подпись, истек срок и т.д.) или нет декодированных данных
                if (err || !decoded) {
                    // Можно логировать ошибку верификации при необходимости (но не сам токен!)
                    // if (err) console.error('JWT Verification Error:', err.message);
                    return resolve(null);
                }

                // Проверяем, что декодированный объект имеет нужную структуру
                if (
                    typeof decoded === 'object' &&
                    'sub' in decoded && // Проверяем наличие обязательного поля sub (user ID)
                    'roles' in decoded && // Проверяем наличие поля roles
                    Array.isArray(decoded.roles) // Убеждаемся, что roles это массив
                ) {
                    // Если все хорошо, возвращаем payload, явно приводя тип
                    resolve(decoded as JwtPayload);
                } else {
                    // Структура payload не соответствует ожидаемой
                    console.warn(
                        'JWT payload structure mismatch after verification:',
                        decoded,
                    );
                    resolve(null);
                }
            });
        });
    }
}
