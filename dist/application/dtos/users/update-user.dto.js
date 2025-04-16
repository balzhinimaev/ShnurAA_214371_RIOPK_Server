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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
// src/application/dtos/users/update-user.dto.ts
const class_validator_1 = require("class-validator");
// --- УБИРАЕМ: import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; ---
// Вместо этого используем JSDoc комментарии в стиле OpenAPI
const validRoles = ['ADMIN', 'ANALYST', 'MANAGER'];
/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateUserDto:
 *       type: object
 *       description: Данные для обновления пользователя (администратором). Позволяет изменять имя и/или роли. Поля опциональны.
 *       properties:
 *         name:
 *           type: string
 *           description: Новое имя пользователя (минимум 2 символа).
 *           example: 'Петр Сергеев'
 *           minLength: 2 # Указываем ограничение длины
 *         roles:
 *           type: array
 *           description: Новый массив ролей пользователя. Должен содержать только допустимые значения.
 *           items:
 *             type: string
 *             enum: ['ADMIN', 'ANALYST', 'MANAGER'] # Перечисляем допустимые роли
 *           example: ['ANALYST', 'MANAGER']
 *       # Пример объекта (не обязательно, но полезно)
 *       example:
 *         name: "Новое Имя"
 *         roles: ["MANAGER"]
 */
class UpdateUserDto {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "roles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Не включаем email и password - их изменение должно быть отдельной операцией
    }
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Имя должно быть строкой' }),
    (0, class_validator_1.MinLength)(2, { message: 'Имя должно содержать минимум 2 символа' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Роли должны быть массивом' }),
    (0, class_validator_1.IsIn)(validRoles, {
        each: true, // Проверяем каждый элемент массива
        message: `Допустимые роли: ${validRoles.join(', ')}`,
    }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "roles", void 0);
//# sourceMappingURL=update-user.dto.js.map