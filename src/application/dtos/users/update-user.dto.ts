// src/application/dtos/users/update-user.dto.ts
import {
    IsString,
    IsOptional,
    IsArray,
    IsIn,
    MinLength,
} from 'class-validator';
import { UserRole } from '../../../domain/entities/user.entity';
// --- УБИРАЕМ: import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; ---
// Вместо этого используем JSDoc комментарии в стиле OpenAPI

const validRoles: UserRole[] = ['ADMIN', 'ANALYST', 'MANAGER'];

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
export class UpdateUserDto {
    @IsOptional()
    @IsString({ message: 'Имя должно быть строкой' })
    @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
    name?: string;

    @IsOptional()
    @IsArray({ message: 'Роли должны быть массивом' })
    @IsIn(validRoles, {
        each: true, // Проверяем каждый элемент массива
        message: `Допустимые роли: ${validRoles.join(', ')}`,
    })
    roles?: UserRole[];

    // Не включаем email и password - их изменение должно быть отдельной операцией
}
