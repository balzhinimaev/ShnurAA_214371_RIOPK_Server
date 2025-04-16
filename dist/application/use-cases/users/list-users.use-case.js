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
exports.ListUsersUseCase = void 0;
// src/application/use-cases/users/list-users.use-case.ts
const tsyringe_1 = require("tsyringe");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const user_response_dto_1 = require("../../dtos/auth/user-response.dto"); // Используем существующий DTO для ответа
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError"); // Для обработки ошибок репозитория
let ListUsersUseCase = class ListUsersUseCase {
    constructor(userRepository) {
        Object.defineProperty(this, "userRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userRepository
        });
    }
    /**
     * Получает список пользователей с пагинацией и сортировкой.
     * @param options - Параметры пагинации, сортировки (и фильтрации, если реализовано).
     * @returns Объект с массивом пользователей (DTO) и информацией для пагинации.
     */
    async execute(options = {}) {
        try {
            // Вызываем метод репозитория для получения пользователей и общего количества
            const { users, total } = await this.userRepository.findAll(options);
            // Преобразуем каждую сущность User в UserResponseDto
            const userDtos = users.map((user) => (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
                excludeExtraneousValues: true, // Убираем поля без @Expose (например, passwordHash)
            }));
            // Возвращаем результат в нужном формате
            return {
                users: userDtos,
                total,
                offset: options.offset ?? 0, // Возвращаем смещение (или 0 по умолчанию)
                limit: options.limit ?? 10, // Возвращаем лимит (или 10 по умолчанию)
            };
        }
        catch (error) {
            console.error('Error in ListUsersUseCase:', error);
            // Если ошибка известного типа (AppError), пробрасываем ее дальше
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            // Иначе оборачиваем в AppError
            throw new AppError_1.AppError('Не удалось получить список пользователей', 500);
        }
    }
};
exports.ListUsersUseCase = ListUsersUseCase;
exports.ListUsersUseCase = ListUsersUseCase = __decorate([
    (0, tsyringe_1.injectable)() // Делаем класс доступным для DI
    ,
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], ListUsersUseCase);
//# sourceMappingURL=list-users.use-case.js.map