// src/application/dtos/customers/list-customers-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { CustomerResponseDto } from './customer-response.dto'; // Импортируем DTO для одного клиента

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
export class ListCustomersResponseDto {
    /**
     * Массив клиентов.
     */
    @Expose()
    @Type(() => CustomerResponseDto) // Указываем тип элементов массива для class-transformer
    customers!: CustomerResponseDto[];

    /**
     * Общее количество клиентов.
     */
    @Expose()
    total!: number;

    /**
     * Примененное смещение.
     */
    @Expose()
    offset!: number;

    /**
     * Примененный лимит.
     */
    @Expose()
    limit!: number;
}
