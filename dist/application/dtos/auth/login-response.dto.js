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
exports.LoginResponseDto = void 0;
// src/application/dtos/auth/login-response.dto.ts
const user_response_dto_1 = require("./user-response.dto");
const class_transformer_1 = require("class-transformer");
/**
 * @openapi
 * components:
 *   schemas:
 *     LoginResponseDto:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT токен доступа.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/UserResponseDto' # Ссылка на схему пользователя
 */
class LoginResponseDto {
    constructor() {
        Object.defineProperty(this, "accessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => user_response_dto_1.UserResponseDto),
    __metadata("design:type", user_response_dto_1.UserResponseDto)
], LoginResponseDto.prototype, "user", void 0);
//# sourceMappingURL=login-response.dto.js.map