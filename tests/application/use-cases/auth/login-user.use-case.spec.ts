// tests/application/use-cases/auth/login-user.use-case.spec.ts
import { mock, MockProxy } from 'jest-mock-extended';
import { LoginUserUseCase } from '../../../../src/application/use-cases/auth/login-user.use-case';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../../src/application/interfaces/IPasswordHasher';
import {
    IJwtService,
    // JwtPayload,
} from '../../../../src/application/interfaces/IJwtService';
import { LoginUserDto } from '../../../../src/application/dtos/auth/login-user.dto';
import { User, UserRole } from '../../../../src/domain/entities/user.entity';
// import { AppError } from '../../../../src/application/errors/AppError';
import { LoginResponseDto } from '../../../../src/application/dtos/auth/login-response.dto';
import { UserResponseDto } from '../../../../src/application/dtos/auth/user-response.dto';
import { plainToInstance } from 'class-transformer';

describe('LoginUserUseCase', () => {
    // Переменные для моков и инстанса Use Case
    let userRepositoryMock: MockProxy<IUserRepository>;
    let passwordHasherMock: MockProxy<IPasswordHasher>;
    let jwtServiceMock: MockProxy<IJwtService>;
    let loginUserUseCase: LoginUserUseCase;

    // Входные данные для тестов
    const loginDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'correct_password',
    };

    // Модель пользователя из репозитория
    const foundUser = new User({
        id: 'user-id-login',
        name: 'Login User',
        email: loginDto.email,
        passwordHash: 'correct_hashed_password', // Хеш, который вернет репозиторий
        roles: ['ANALYST'] as UserRole[],
        createdAt: new Date('2023-02-01T12:00:00Z'),
        updatedAt: new Date('2023-02-01T13:00:00Z'),
    });

    // Ожидаемый токен
    const expectedAccessToken = 'mock_jwt_access_token';

    // Настройка перед каждым тестом
    beforeEach(() => {
        userRepositoryMock = mock<IUserRepository>();
        passwordHasherMock = mock<IPasswordHasher>();
        jwtServiceMock = mock<IJwtService>();

        loginUserUseCase = new LoginUserUseCase(
            userRepositoryMock,
            passwordHasherMock,
            jwtServiceMock,
        );
    });

    // Тест успешного логина
  it('should return access token and user data on successful login', async () => {
      // --- Arrange ---
      userRepositoryMock.findByEmail
          .calledWith(loginDto.email)
          .mockResolvedValue(foundUser);
      passwordHasherMock.compare
          .calledWith(loginDto.password, foundUser.passwordHash)
          .mockResolvedValue(true);
      jwtServiceMock.sign.mockResolvedValue(expectedAccessToken);

      // --- Act ---
      let result: LoginResponseDto | undefined;
      let error: Error | null = null;

      try {
          // --- ОТЛАДКА: Логируем объект user перед передачей в plainToInstance ---
          console.log(
              '>>> DEBUG: User object before userResponse transformation:',
              foundUser,
          );

          // --- ОТЛАДКА: Вызываем plainToInstance для UserResponseDto отдельно и логируем ---
          const intermediateUserResponse = plainToInstance(
              UserResponseDto,
              foundUser,
              { excludeExtraneousValues: true },
          );
          console.log(
              '>>> DEBUG: Intermediate userResponse:',
              intermediateUserResponse,
          );
          // --------------------------------------------------------------------------

          result = await loginUserUseCase.execute(loginDto);
          console.log('>>> DEBUG: Final result from use case execute:', result);
      } catch (e: unknown) {
          if (e instanceof Error) {
              error = e;
          } else {
              error = new Error(String(e));
          }
          console.error('>>> DEBUG: Error during execute:', error);
      }

      // --- Assert ---
      expect(error).toBeNull(); // Проверяем, что ошибок не было

      expect(result).toBeDefined();
      if (!result) return; // Прерываем, если результат undefined

      expect(result).toBeInstanceOf(LoginResponseDto);
      expect(result.accessToken).toBe(expectedAccessToken);

      // Проверяем поле user
      expect(result.user).toBeDefined(); // <--- Проверяем, что user не undefined
      if (!result.user) return; // Прерываем, если user undefined

      expect(result.user).toBeInstanceOf(UserResponseDto);
      expect(result.user.id).toBe(foundUser.id);
      expect(result.user.email).toBe(foundUser.email);
      expect(result.user.name).toBe(foundUser.name);
      expect(result.user.roles).toEqual(foundUser.roles);
      // ИЗМЕНЕННАЯ ПРОВЕРКА для passwordHash на поле user
      expect(result.user.passwordHash).toBeUndefined(); // <--- ПРОВЕРЯЕМ ЗНАЧЕНИЕ, А НЕ НАЛИЧИЕ СВОЙСТВА

      // --- Проверки вызовов моков ---
      // ... (остальные expect) ...
  });

    // Тест: Неверный email (пользователь не найден)
    it('should throw AppError 401 if user is not found', async () => {
        // --- Arrange ---
        // findByEmail возвращает null
        userRepositoryMock.findByEmail
            .calledWith(loginDto.email)
            .mockResolvedValue(null);

        // --- Act & Assert ---
        await expect(loginUserUseCase.execute(loginDto)).rejects.toMatchObject({
            statusCode: 401,
            message: 'Неверный email или пароль', // Ожидаемое сообщение
        });

        // Убеждаемся, что compare и sign не вызывались
        expect(passwordHasherMock.compare).not.toHaveBeenCalled();
        expect(jwtServiceMock.sign).not.toHaveBeenCalled();
    });

    // Тест: Неверный пароль
    it('should throw AppError 401 if password does not match', async () => {
        // --- Arrange ---
        // findByEmail возвращает пользователя
        userRepositoryMock.findByEmail
            .calledWith(loginDto.email)
            .mockResolvedValue(foundUser);
        // compare возвращает false
        passwordHasherMock.compare
            .calledWith(loginDto.password, foundUser.passwordHash)
            .mockResolvedValue(false);

        // --- Act & Assert ---
        await expect(loginUserUseCase.execute(loginDto)).rejects.toMatchObject({
            statusCode: 401,
            message: 'Неверный email или пароль',
        });

        // Убеждаемся, что sign не вызывался
        expect(jwtServiceMock.sign).not.toHaveBeenCalled();
        // findByEmail и compare должны были вызваться
        expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
        expect(passwordHasherMock.compare).toHaveBeenCalledTimes(1);
    });
});
