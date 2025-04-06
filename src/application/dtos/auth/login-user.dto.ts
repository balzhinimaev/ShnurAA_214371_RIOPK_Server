// src/application/dtos/auth/login-user.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginUserDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя.
 *           example: ivan.ivanov@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Пароль пользователя.
 *           example: password123
 */
export class LoginUserDto {
    // ... декораторы ...
    @IsNotEmpty({ message: 'Email не может быть пустым' })
    @IsEmail({}, { message: 'Некорректный формат Email' })
    email!: string;

    @IsNotEmpty({ message: 'Пароль не может быть пустым' })
    @IsString({ message: 'Пароль должен быть строкой' })
    password!: string;
}
