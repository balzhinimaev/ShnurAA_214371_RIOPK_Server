// src/application/dtos/auth/register-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
    @IsNotEmpty({ message: 'Имя не может быть пустым' })
    @IsString({ message: 'Имя должно быть строкой' })
    name!: string; // ! - definite assignment assertion (уверены, что будет присвоено)

    @IsNotEmpty({ message: 'Email не может быть пустым' })
    @IsEmail({}, { message: 'Некорректный формат Email' })
    email!: string;

    @IsNotEmpty({ message: 'Пароль не может быть пустым' })
    @IsString({ message: 'Пароль должен быть строкой' })
    @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
    password!: string;
}
