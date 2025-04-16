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
exports.ListCustomersResponseDto = void 0;
// src/application/dtos/customers/list-customers-response.dto.ts
const class_transformer_1 = require("class-transformer");
const customer_response_dto_1 = require("./customer-response.dto"); // Импортируем DTO для одного клиента
/**
 * @openapi
 * components:
 *   schemas:
 *     ListCustomersResponseDto:
 *       type: object
 *       description: Ответ API со списком клиентов и информацией для пагинации.
 *       properties:
 *         customers:
 *           type: array
 *           description: Массив клиентов, соответствующих запросу.
 *           items:
 *             $ref: '#/components/schemas/CustomerResponseDto'
 *         total:
 *           type: integer
 *           description: Общее количество клиентов, найденных для данного пользователя (без учета limit/offset).
 *           example: 53
 *         offset:
 *           type: integer
 *           description: Смещение (skip), примененное к результату.
 *           example: 0
 *         limit:
 *           type: integer
 *           description: Максимальное количество клиентов на странице (limit), примененное к результату.
 *           example: 10
 *       required:
 *         - customers
 *         - total
 *         - offset
 *         - limit
 */
class ListCustomersResponseDto {
    constructor() {
        /**
         * Массив клиентов.
         */
        Object.defineProperty(this, "customers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Общее количество клиентов.
         */
        Object.defineProperty(this, "total", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Примененное смещение.
         */
        Object.defineProperty(this, "offset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Примененный лимит.
         */
        Object.defineProperty(this, "limit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.ListCustomersResponseDto = ListCustomersResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => customer_response_dto_1.CustomerResponseDto) // Указываем тип элементов массива для class-transformer
    ,
    __metadata("design:type", Array)
], ListCustomersResponseDto.prototype, "customers", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ListCustomersResponseDto.prototype, "total", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ListCustomersResponseDto.prototype, "offset", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ListCustomersResponseDto.prototype, "limit", void 0);
//# sourceMappingURL=list-customers-response.dto.js.map