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
exports.UserResponseDto = void 0;
const class_transformer_1 = require("class-transformer");
/**
 * @openapi
 * components:
 *   schemas:
 *     UserResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid # Или ObjectId, если используется MongoDB ID
 *           description: Уникальный идентификатор пользователя.
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           description: Имя пользователя.
 *           example: Иван Иванов
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя.
 *           example: ivan.ivanov@example.com
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ADMIN, ANALYST, MANAGER] # Перечислите возможные роли
 *           description: Роли пользователя в системе.
 *           example: [ANALYST]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания пользователя.
 *           example: 2023-01-01T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления пользователя.
 *           example: 2023-01-01T12:30:00.000Z
 */
class UserResponseDto {
    constructor() {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // ... остальные поля с @Expose/@Exclude ...
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "email", {
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
        Object.defineProperty(this, "passwordHash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], UserResponseDto.prototype, "roles", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "passwordHash", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=user-response.dto.js.map