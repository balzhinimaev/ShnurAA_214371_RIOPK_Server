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
exports.UpdateCustomerDto = void 0;
// src/application/dtos/customers/update-customer.dto.ts
const class_validator_1 = require("class-validator");
/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateCustomerDto:
 *       type: object
 *       description: Данные для обновления информации о клиенте. Поля являются опциональными; будут обновлены только переданные поля.
 *       properties:
 *         name:
 *           type: string
 *           description: Новое название или имя клиента (минимум 2 символа).
 *           example: "ООО Ромашка Плюс"
 *           minLength: 2
 *         contactInfo:
 *           type: string
 *           description: Новая контактная информация клиента (например, email, телефон, адрес). Может быть пустой строкой для очистки.
 *           example: "info@romashka-plus.ru"
 *           nullable: true # Допускается передача null для очистки (если бэкенд это поддерживает)
 *       # Пример объекта запроса: может содержать одно или оба поля
 *       example:
 *         name: "ООО Ромашка Супер"
 *         contactInfo: "sales@romashkasuper.com"
 */
class UpdateCustomerDto {
    constructor() {
        /**
         * Новое название/имя клиента.
         * Если не передано, название не изменится.
         * Должно быть строкой минимум из 2 символов.
         */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Новая контактная информация клиента.
         * Если не передано, информация не изменится.
         * Может быть строкой (включая пустую).
         * Для очистки поля можно передать пустую строку "" или null (если API поддерживает обработку null).
         */
        Object.defineProperty(this, "contactInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Разрешаем null, если это имеет смысл для вашей логики
    }
}
exports.UpdateCustomerDto = UpdateCustomerDto;
__decorate([
    (0, class_validator_1.IsOptional)() // Поле необязательное
    ,
    (0, class_validator_1.IsString)({ message: 'Название клиента должно быть строкой.' }),
    (0, class_validator_1.MinLength)(2, {
        message: 'Название клиента должно содержать минимум 2 символа.',
    }),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)() // Поле необязательное
    ,
    (0, class_validator_1.IsString)({ message: 'Контактная информация должна быть строкой.' })
    // MinLength здесь не нужен, так как поле может быть пустым
    ,
    __metadata("design:type", Object)
], UpdateCustomerDto.prototype, "contactInfo", void 0);
//# sourceMappingURL=update-customer.dto.js.map