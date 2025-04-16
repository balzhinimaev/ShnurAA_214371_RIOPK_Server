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
exports.UpdateUserUseCase = void 0;
// src/application/use-cases/users/update-user.use-case.ts
const tsyringe_1 = require("tsyringe");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const user_response_dto_1 = require("../../dtos/auth/user-response.dto");
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError");
let UpdateUserUseCase = class UpdateUserUseCase {
    constructor(userRepository) {
        Object.defineProperty(this, "userRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userRepository
        });
    }
    /**
     * Обновляет данные пользователя (имя, роли).
     * @param userId - ID пользователя для обновления.
     * @param data - DTO с новыми данными (UpdateUserDto).
     * @returns Обновленный UserResponseDto если пользователь найден и обновлен, иначе null.
     */
    async execute(userId, data) {
        // Преобразуем DTO в данные для репозитория (UpdateUserData)
        // Это необязательно, если типы совпадают, но для ясности можно сделать
        const updateData = {
            name: data.name,
            roles: data.roles,
        };
        // Убираем undefined поля, чтобы не перезаписать существующие значения на undefined
        Object.keys(updateData).forEach((key) => updateData[key] === undefined &&
            delete updateData[key]);
        // Проверяем, есть ли вообще данные для обновления
        if (Object.keys(updateData).length === 0) {
            console.warn(`UpdateUserUseCase: No actual data provided to update user ${userId}.`);
            // Получаем и возвращаем текущего пользователя без изменений
            const currentUser = await this.userRepository.findById(userId);
            if (!currentUser)
                return null; // Если не нашли
            return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, currentUser, {
                excludeExtraneousValues: true,
            });
        }
        try {
            // Вызываем метод репозитория для обновления
            const updatedUser = await this.userRepository.update(userId, updateData);
            if (!updatedUser) {
                return null; // Пользователь не найден
            }
            // Преобразуем обновленную сущность в DTO
            const userDto = (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, updatedUser, {
                excludeExtraneousValues: true,
            });
            return userDto;
        }
        catch (error) {
            console.error(`Error in UpdateUserUseCase for ID ${userId}:`, error);
            if (error instanceof AppError_1.AppError) {
                // Пробрасываем AppError (например, 400 из-за неверной роли)
                throw error;
            }
            throw new AppError_1.AppError('Не удалось обновить пользователя', 500);
        }
    }
};
exports.UpdateUserUseCase = UpdateUserUseCase;
exports.UpdateUserUseCase = UpdateUserUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], UpdateUserUseCase);
//# sourceMappingURL=update-user.use-case.js.map