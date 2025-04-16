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
exports.RegisterUserDto = void 0;
// src/application/dtos/auth/register-user.dto.ts
const class_validator_1 = require("class-validator");
/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterUserDto:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Имя пользователя.
 *           example: Иван Иванов
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя (должен быть уникальным).
 *           example: ivan.ivanov@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: Пароль пользователя (минимум 6 символов).
 *           example: password123
 */
class RegisterUserDto {
    constructor() {
        // ... декораторы class-validator ...
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
        Object.defineProperty(this, "password", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Имя не может быть пустым' }),
    (0, class_validator_1.IsString)({ message: 'Имя должно быть строкой' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Email не может быть пустым' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Некорректный формат Email' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Пароль не может быть пустым' }),
    (0, class_validator_1.IsString)({ message: 'Пароль должен быть строкой' }),
    (0, class_validator_1.MinLength)(6, { message: 'Пароль должен быть не менее 6 символов' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
//# sourceMappingURL=register-user.dto.js.map