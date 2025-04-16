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
exports.GetUserByIdUseCase = void 0;
// src/application/use-cases/users/get-user-by-id.use-case.ts
const tsyringe_1 = require("tsyringe");
const IUserRepository_1 = require("../../../domain/repositories/IUserRepository");
const user_response_dto_1 = require("../../dtos/auth/user-response.dto");
const class_transformer_1 = require("class-transformer");
const AppError_1 = require("../../errors/AppError");
let GetUserByIdUseCase = class GetUserByIdUseCase {
    constructor(userRepository) {
        Object.defineProperty(this, "userRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: userRepository
        });
    }
    /**
     * Получает пользователя по ID.
     * @param userId - ID искомого пользователя.
     * @returns UserResponseDto если пользователь найден, иначе null.
     */
    async execute(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return null; // Пользователь не найден
            }
            // Преобразуем в DTO
            const userDto = (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
                excludeExtraneousValues: true,
            });
            return userDto;
        }
        catch (error) {
            console.error(`Error in GetUserByIdUseCase for ID ${userId}:`, error);
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError('Не удалось получить пользователя по ID', 500);
        }
    }
};
exports.GetUserByIdUseCase = GetUserByIdUseCase;
exports.GetUserByIdUseCase = GetUserByIdUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(IUserRepository_1.UserRepositoryToken)),
    __metadata("design:paramtypes", [Object])
], GetUserByIdUseCase);
//# sourceMappingURL=get-user-by-id.use-case.js.map