"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUserUseCase = void 0;
// src/application/use-cases/auth/login-user.use-case.ts
const tsyringe_1 = require("tsyringe");
const login_response_dto_1 = require("../../dtos/auth/login-response.dto");
const user_response_dto_1 = require("../../dtos/auth/user-response.dto");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const IPasswordHasher_1 = require("../../interfaces/IPasswordHasher");
const IJwtService_1 = require("../../interfaces/IJwtService");
const AppError_1 = require("../../errors/AppError");
const class_transformer_1 = require("class-transformer"); // Импортируем plainToInstance
let LoginUserUseCase = class LoginUserUseCase {
    constructor(userRepository, passwordHasher, jwtService) {
        Object.defineProperty(this, "userRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userRepository
        });
        Object.defineProperty(this, "passwordHasher", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: passwordHasher
        });
        Object.defineProperty(this, "jwtService", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jwtService
        });
    }
    /**
     * Аутентифицирует пользователя и возвращает JWT токен.
     * @param data - Данные для входа (email, password).
     * @returns Промис с объектом, содержащим accessToken и данные пользователя.
     * @throws {AppError} Если email не найден или пароль неверный.
     */
    async execute(data) {
        // 1. Находим пользователя по email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            // Не уточняем причину (email или пароль) для безопасности
            throw new AppError_1.AppError('Неверный email или пароль', 401); // 401 Unauthorized
        }
        // 2. Сравниваем пароли
        const isPasswordValid = await this.passwordHasher.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError_1.AppError('Неверный email или пароль', 401);
        }
        // 3. Генерируем JWT
        const jwtPayload = {
            sub: user.id, // Subject (ID пользователя)
            roles: user.roles, // Роли
            // Можно добавить email или name, если нужно в payload, но ID и ролей обычно достаточно
        };
        const accessToken = await this.jwtService.sign(jwtPayload);
        // 4. Готовим ответ
        // Сначала преобразуем User -> UserResponseDto
        const userResponse = (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
            excludeExtraneousValues: true, // Включать только поля с @Expose()
        });
        // Затем создаем объект для LoginResponseDto и преобразуем его
        const loginResponsePayload = {
            accessToken: accessToken,
            user: userResponse, // Вставляем уже преобразованный userResponse
        };
        // Преобразуем loginResponsePayload -> LoginResponseDto
        const loginResponse = (0, class_transformer_1.plainToInstance)(login_response_dto_1.LoginResponseDto, loginResponsePayload, {
            excludeExtraneousValues: true, // Включать только поля с @Expose()
        });
        return loginResponse;
    }
};
exports.LoginUserUseCase = LoginUserUseCase;
exports.LoginUserUseCase = LoginUserUseCase = __decorate([
    (0, tsyringe_1.injectable)() // Делаем Use Case доступным для DI
    ,
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __param(1, (0, tsyringe_1.inject)(IPasswordHasher_1.PasswordHasherToken)),
    __param(2, (0, tsyringe_1.inject)(IJwtService_1.JwtServiceToken)),
    __metadata("design:paramtypes", [Object, Object, Object])
], LoginUserUseCase);
//# sourceMappingURL=login-user.use-case.js.map