// src/application/dtos/auth/login-response.dto.ts
import { UserResponseDto } from './user-response.dto';
import { Expose, Type } from 'class-transformer';

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
export class LoginResponseDto {
    @Expose()
    accessToken!: string;

    @Expose()
    @Type(() => UserResponseDto)
    user!: UserResponseDto;
}
