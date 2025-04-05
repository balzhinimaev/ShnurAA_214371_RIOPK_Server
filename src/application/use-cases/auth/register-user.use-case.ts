// src/application/use-cases/auth/register-user.use-case.ts
import { injectable, inject } from 'tsyringe';
import { RegisterUserDto } from '../../dtos/auth/register-user.dto';
import { UserResponseDto } from '../../dtos/auth/user-response.dto';
import {
    IUserRepository,
    UserRepositoryToken,
} from '../../../domain/repositories/IUserRepository';
import {
    IPasswordHasher,
    PasswordHasherToken,
} from '../../interfaces/IPasswordHasher';
import { AppError } from '../../errors/AppError';
import { UserRole } from '../../../domain/entities/user.entity';
import { plainToInstance } from 'class-transformer'; // Импортируем plainToInstance

@injectable() // Делаем Use Case доступным для DI
export class RegisterUserUseCase {
    constructor(
        @inject(UserRepositoryToken) // Внедряем репозиторий
        private userRepository: IUserRepository,
        @inject(PasswordHasherToken) // Внедряем хешер паролей
        private passwordHasher: IPasswordHasher,
    ) {}

    /**
     * Регистрирует нового пользователя.
     * @param data - Данные для регистрации (name, email, password).
     * @returns Промис с данными созданного пользователя (без хеша пароля).
     * @throws {AppError} Если email уже занят.
     */
    async execute(data: RegisterUserDto): Promise<UserResponseDto> {
        // 1. Проверяем, существует ли пользователь с таким email
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new AppError(
                'Пользователь с таким Email уже существует',
                409,
            ); // 409 Conflict
        }

        // 2. Хешируем пароль
        const passwordHash = await this.passwordHasher.hash(data.password);

        // 3. Создаем пользователя в БД
        // Передаем данные для создания, роль по умолчанию ['ANALYST']
        const newUser = await this.userRepository.create({
            name: data.name,
            email: data.email,
            passwordHash: passwordHash,
            roles: ['ANALYST'] as UserRole[], // Задаем роль по умолчанию
        });

        // 4. Преобразуем сущность User в UserResponseDto для ответа
        // Используем plainToInstance: (Целевой Класс, Исходный Объект, Опции)
        const userResponse = plainToInstance(UserResponseDto, newUser, {
            excludeExtraneousValues: true, // Включать только поля с @Expose()
        });

        return userResponse;
    }
}
