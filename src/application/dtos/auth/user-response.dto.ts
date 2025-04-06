// src/application/dtos/auth/user-response.dto.ts
import { UserRole } from '../../../domain/entities/user.entity';
import { Exclude, Expose } from 'class-transformer';

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
export class UserResponseDto {
    @Expose()
    id!: string;
    // ... остальные поля с @Expose/@Exclude ...
    @Expose()
    name!: string;
    @Expose()
    email!: string;
    @Expose()
    roles!: UserRole[];
    @Exclude()
    passwordHash?: string;
    @Expose()
    createdAt!: Date;
    @Expose()
    updatedAt!: Date;
}
