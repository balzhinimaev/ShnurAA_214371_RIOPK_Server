// src/application/dtos/customers/update-customer.dto.ts
import { IsString, IsOptional, MinLength } from 'class-validator';

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
export class UpdateCustomerDto {
    /**
     * Новое название/имя клиента.
     * Если не передано, название не изменится.
     * Должно быть строкой минимум из 2 символов.
     */
    @IsOptional() // Поле необязательное
    @IsString({ message: 'Название клиента должно быть строкой.' })
    @MinLength(2, {
        message: 'Название клиента должно содержать минимум 2 символа.',
    })
    name?: string;

    /**
     * Новая контактная информация клиента.
     * Если не передано, информация не изменится.
     * Может быть строкой (включая пустую).
     * Для очистки поля можно передать пустую строку "" или null (если API поддерживает обработку null).
     */
    @IsOptional() // Поле необязательное
    @IsString({ message: 'Контактная информация должна быть строкой.' })
    // MinLength здесь не нужен, так как поле может быть пустым
    contactInfo?: string | null; // Разрешаем null, если это имеет смысл для вашей логики
}
