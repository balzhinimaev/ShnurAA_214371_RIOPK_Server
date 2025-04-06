// src/application/dtos/auth/register-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
export class RegisterUserDto {
    // ... декораторы class-validator ...
    @IsNotEmpty({ message: 'Имя не может быть пустым' })
    @IsString({ message: 'Имя должно быть строкой' })
    name!: string;

    @IsNotEmpty({ message: 'Email не может быть пустым' })
    @IsEmail({}, { message: 'Некорректный формат Email' })
    email!: string;

    @IsNotEmpty({ message: 'Пароль не может быть пустым' })
    @IsString({ message: 'Пароль должен быть строкой' })
    @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
    password!: string;
}
