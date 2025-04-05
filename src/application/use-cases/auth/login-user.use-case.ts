// src/application/use-cases/auth/login-user.use-case.ts
import { injectable, inject } from 'tsyringe';
import { LoginUserDto } from '../../dtos/auth/login-user.dto';
import { LoginResponseDto } from '../../dtos/auth/login-response.dto';
import { UserResponseDto } from '../../dtos/auth/user-response.dto';
import {
    IUserRepository,
    UserRepositoryToken,
} from '../../../domain/repositories/IUserRepository';
import {
    IPasswordHasher,
    PasswordHasherToken,
} from '../../interfaces/IPasswordHasher';
import {
    IJwtService,
    JwtServiceToken,
    JwtPayload,
} from '../../interfaces/IJwtService';
import { AppError } from '../../errors/AppError';
import { plainToInstance } from 'class-transformer'; // Импортируем plainToInstance

@injectable() // Делаем Use Case доступным для DI
export class LoginUserUseCase {
    constructor(
        @inject(UserRepositoryToken)
        private userRepository: IUserRepository,
        @inject(PasswordHasherToken)
        private passwordHasher: IPasswordHasher,
        @inject(JwtServiceToken)
        private jwtService: IJwtService,
    ) {}

    /**
     * Аутентифицирует пользователя и возвращает JWT токен.
     * @param data - Данные для входа (email, password).
     * @returns Промис с объектом, содержащим accessToken и данные пользователя.
     * @throws {AppError} Если email не найден или пароль неверный.
     */
    async execute(data: LoginUserDto): Promise<LoginResponseDto> {
        // 1. Находим пользователя по email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            // Не уточняем причину (email или пароль) для безопасности
            throw new AppError('Неверный email или пароль', 401); // 401 Unauthorized
        }

        // 2. Сравниваем пароли
        const isPasswordValid = await this.passwordHasher.compare(
            data.password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new AppError('Неверный email или пароль', 401);
        }

        // 3. Генерируем JWT
        const jwtPayload: JwtPayload = {
            sub: user.id, // Subject (ID пользователя)
            roles: user.roles, // Роли
            // Можно добавить email или name, если нужно в payload, но ID и ролей обычно достаточно
        };
        const accessToken = await this.jwtService.sign(jwtPayload);

        // 4. Готовим ответ
        // Сначала преобразуем User -> UserResponseDto
        const userResponse = plainToInstance(UserResponseDto, user, {
            excludeExtraneousValues: true, // Включать только поля с @Expose()
        });

        // Затем создаем объект для LoginResponseDto и преобразуем его
        const loginResponsePayload = {
            accessToken: accessToken,
            user: userResponse, // Вставляем уже преобразованный userResponse
        };
        // Преобразуем loginResponsePayload -> LoginResponseDto
        const loginResponse = plainToInstance(
            LoginResponseDto,
            loginResponsePayload,
            {
                excludeExtraneousValues: true, // Включать только поля с @Expose()
            },
        );

        return loginResponse;
    }
}
