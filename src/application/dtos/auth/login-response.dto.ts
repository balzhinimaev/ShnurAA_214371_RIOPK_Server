// src/application/dtos/auth/login-response.dto.ts
import { UserResponseDto } from './user-response.dto';
import { Expose, Type } from 'class-transformer';

export class LoginResponseDto {
    @Expose()
    accessToken!: string;

    @Expose()
    @Type(() => UserResponseDto) // Указываем тип для трансформации вложенного объекта
    user!: UserResponseDto;
}
