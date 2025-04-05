// src/application/dtos/auth/user-response.dto.ts
import { UserRole } from '../../../domain/entities/user.entity';
import { Exclude, Expose } from 'class-transformer'; // Для контроля над сериализацией

export class UserResponseDto {
    @Expose() // Явно указываем, что это поле нужно включить
    id!: string;

    @Expose()
    name!: string;

    @Expose()
    email!: string;

    @Expose()
    roles!: UserRole[];

    @Exclude() // Исключаем хеш пароля по умолчанию
    passwordHash?: string; // Сделаем опциональным на всякий случай

    @Expose()
    createdAt!: Date;

    @Expose()
    updatedAt!: Date;

    // Сюда можно добавить конструктор или статический метод для маппинга из User entity
    // static fromEntity(user: User): UserResponseDto {
    //   const dto = new UserResponseDto();
    //   dto.id = user.id;
    //   // ...
    //   return dto;
    // }
}
