// src/application/dtos/customers/customer-response.dto.ts
import { Expose } from 'class-transformer';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';

/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerResponseDto:
 *       type: object
 *       description: Представление данных клиента для ответа API.
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор клиента (обычно ObjectId).
 *           example: "6151f5a0a9a7b1001b1a77a5"
 *         name:
 *           type: string
 *           description: Название или имя клиента.
 *           example: "ООО Ромашка"
 *         unp:
 *           type: string
 *           nullable: true # Указываем, что УНП может отсутствовать
 *           description: УНП клиента (если предоставлен).
 *           example: "7712345678"
 *         contactInfo:
 *           type: string
 *           nullable: true # Контактная информация тоже может отсутствовать
 *           description: Контактная информация клиента (например, email или телефон).
 *           example: "contact@romashka.ru"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания записи клиента.
 *           example: "2023-10-01T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления записи клиента.
 *           example: "2024-01-15T14:30:00.000Z"
 *         riskScore:
 *           type: number
 *           nullable: true
 *           description: Оценка рисковости клиента (0-100). Рассчитывается на основе истории работы с задолженностью.
 *           example: 45
 *         riskLevel:
 *           type: string
 *           nullable: true
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Уровень риска клиента на основе riskScore.
 *           example: "MEDIUM"
 *       required:
 *         - id
 *         - name
 *         - createdAt
 *         - updatedAt
 */
export class CustomerResponseDto {
    /**
     * Уникальный идентификатор клиента.
     * @example "6151f5a0a9a7b1001b1a77a5"
     */
    @Expose()
    id!: string;

    /**
     * Название или имя клиента.
     * @example "ООО Ромашка"
     */
    @Expose()
    name!: string;

    /**
     * УНП клиента (может отсутствовать).
     * @example "7712345678"
     */
    @Expose()
    unp?: string;

    /**
     * Контактная информация клиента (может отсутствовать).
     * @example "contact@romashka.ru"
     */
    @Expose()
    contactInfo?: string;

    /**
     * Дата и время создания записи клиента.
     */
    @Expose()
    createdAt!: Date;

    /**
     * Дата и время последнего обновления записи клиента.
     */
    @Expose()
    updatedAt!: Date;

    /**
     * Оценка рисковости клиента (0-100). Рассчитывается на основе истории работы с задолженностью.
     * @example 45
     */
    @Expose()
    riskScore?: number;

    /**
     * Уровень риска клиента на основе riskScore.
     * @example "MEDIUM"
     */
    @Expose()
    riskLevel?: RiskLevel;

    // Поле userId не включается в ответ API, поэтому для него нет @Expose
}
