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
exports.DeleteUserUseCase = void 0;
// src/application/use-cases/users/delete-user.use-case.ts
const tsyringe_1 = require("tsyringe");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const AppError_1 = require("../../errors/AppError");
let DeleteUserUseCase = class DeleteUserUseCase {
    constructor(userRepository) {
        Object.defineProperty(this, "userRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userRepository
        });
    }
    /**
     * Удаляет пользователя по ID.
     * @param userId - ID пользователя для удаления.
     * @returns true если пользователь был удален, false если не найден.
     */
    async execute(userId) {
        try {
            // Вызываем метод репозитория для удаления
            const wasDeleted = await this.userRepository.delete(userId);
            return wasDeleted;
        }
        catch (error) {
            console.error(`Error in DeleteUserUseCase for ID ${userId}:`, error);
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError('Не удалось удалить пользователя', 500);
        }
    }
};
exports.DeleteUserUseCase = DeleteUserUseCase;
exports.DeleteUserUseCase = DeleteUserUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], DeleteUserUseCase);
//# sourceMappingURL=delete-user.use-case.js.map