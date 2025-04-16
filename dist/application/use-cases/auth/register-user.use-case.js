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
exports.RegisterUserUseCase = void 0;
// src/application/use-cases/auth/register-user.use-case.ts
const tsyringe_1 = require("tsyringe");
const user_response_dto_1 = require("../../dtos/auth/user-response.dto");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const IPasswordHasher_1 = require("../../interfaces/IPasswordHasher");
const AppError_1 = require("../../errors/AppError");
const class_transformer_1 = require("class-transformer"); // Импортируем plainToInstance
let RegisterUserUseCase = class RegisterUserUseCase {
    constructor(userRepository, passwordHasher) {
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
    }
    /**
     * Регистрирует нового пользователя.
     * @param data - Данные для регистрации (name, email, password).
     * @returns Промис с данными созданного пользователя (без хеша пароля).
     * @throws {AppError} Если email уже занят.
     */
    async execute(data) {
        // 1. Проверяем, существует ли пользователь с таким email
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new AppError_1.AppError('Пользователь с таким Email уже существует', 409); // 409 Conflict
        }
        // 2. Хешируем пароль
        const passwordHash = await this.passwordHasher.hash(data.password);
        // 3. Создаем пользователя в БД
        // Передаем данные для создания, роль по умолчанию ['ANALYST']
        const newUser = await this.userRepository.create({
            name: data.name,
            email: data.email,
            passwordHash: passwordHash,
            roles: ['ANALYST'], // Задаем роль по умолчанию
        });
        // 4. Преобразуем сущность User в UserResponseDto для ответа
        // Используем plainToInstance: (Целевой Класс, Исходный Объект, Опции)
        const userResponse = (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, newUser, {
            excludeExtraneousValues: true, // Включать только поля с @Expose()
        });
        return userResponse;
    }
};
exports.RegisterUserUseCase = RegisterUserUseCase;
exports.RegisterUserUseCase = RegisterUserUseCase = __decorate([
    (0, tsyringe_1.injectable)() // Делаем Use Case доступным для DI
    ,
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __param(1, (0, tsyringe_1.inject)(IPasswordHasher_1.PasswordHasherToken)),
    __metadata("design:paramtypes", [Object, Object])
], RegisterUserUseCase);
//# sourceMappingURL=register-user.use-case.js.map