// src/application/dtos/auth/login-user.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
    @IsNotEmpty({ message: 'Email не может быть пустым' })
    @IsEmail({}, { message: 'Некорректный формат Email' })
    email!: string;

    @IsNotEmpty({ message: 'Пароль не может быть пустым' })
    @IsString({ message: 'Пароль должен быть строкой' })
    password!: string;
}
