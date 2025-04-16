"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonWebTokenService = void 0;
// src/infrastructure/services/jsonwebtoken.service.ts
const tsyringe_1 = require("tsyringe");
const jwt = __importStar(require("jsonwebtoken"));
const ms_1 = __importDefault(require("ms"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = require("../../application/errors/AppError");
let JsonWebTokenService = class JsonWebTokenService {
    constructor() {
        Object.defineProperty(this, "secret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config_1.default.jwt.secret
        });
        Object.defineProperty(this, "expiresInString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config_1.default.jwt.expiresIn || '1d'
        });
    }
    // ... (метод sign остается без изменений) ...
    async sign(payload) {
        try {
            const expiresInMs = (0, ms_1.default)(this.expiresInString);
            if (expiresInMs === undefined || isNaN(expiresInMs)) {
                console.error(`Invalid JWT expiresIn format in config: '${this.expiresInString}'.`);
                throw new AppError_1.AppError('Неверный формат времени жизни JWT в конфигурации.', 500);
            }
            const expiresInSeconds = Math.floor(expiresInMs / 1000);
            return this.generateToken(payload, expiresInSeconds);
        }
        catch (error) {
            console.error('JWT Signing Error:', error);
            throw new AppError_1.AppError(`Ошибка подписи JWT: ${error instanceof Error ? error.message : error}`, 500);
        }
    }
    generateToken(payload, expiresInSeconds) {
        return new Promise((resolve, reject) => {
            const options = {
                algorithm: 'HS256',
                expiresIn: expiresInSeconds,
                subject: payload.sub,
            };
            const tokenPayload = { roles: payload.roles };
            jwt.sign(tokenPayload, this.secret, options, (err, token) => {
                if (err || !token) {
                    reject(new AppError_1.AppError(`Ошибка генерации токена: ${err?.message || 'неизвестная ошибка'}`, 500));
                }
                else {
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
    async verify(token) {
        return new Promise((resolve) => {
            const verifyOptions = {
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
                    const potentialPayload = decoded;
                    const sub = potentialPayload.sub;
                    const roles = potentialPayload.roles;
                    const iat = potentialPayload.iat;
                    const exp = potentialPayload.exp;
                    if (sub &&
                        typeof sub === 'string' && // Проверяем sub
                        roles &&
                        Array.isArray(roles) &&
                        roles.every((r) => typeof r === 'string') // Проверяем roles
                    ) {
                        // --- Конец Type Guard ---
                        // Все проверки пройдены, создаем объект нашего типа JwtPayload
                        const validPayload = {
                            sub: sub,
                            roles: roles, // Теперь каст безопасен
                            iat: typeof iat === 'number' ? iat : undefined,
                            exp: typeof exp === 'number' ? exp : undefined,
                        };
                        resolve(validPayload);
                    }
                    else {
                        // Структура объекта не соответствует ожидаемой
                        console.warn('JWT payload structure mismatch or invalid types after verification:', decoded);
                        resolve(null);
                    }
                }
                else {
                    // decoded оказался не объектом (маловероятно для стандартных JWT)
                    console.warn('JWT decoded value is not an object:', decoded);
                    resolve(null);
                }
            });
        });
    }
};
exports.JsonWebTokenService = JsonWebTokenService;
exports.JsonWebTokenService = JsonWebTokenService = __decorate([
    (0, tsyringe_1.injectable)()
], JsonWebTokenService);
//# sourceMappingURL=jsonwebtoken.service.js.map