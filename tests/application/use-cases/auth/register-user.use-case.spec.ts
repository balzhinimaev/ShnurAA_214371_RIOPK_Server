// tests/application/use-cases/auth/register-user.use-case.spec.ts
import { mock, MockProxy } from 'jest-mock-extended'; // Убрали DeepMockProxy, он тут не нужен
import { RegisterUserUseCase } from '../../../../src/application/use-cases/auth/register-user.use-case';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../../../src/application/interfaces/IPasswordHasher';
import { RegisterUserDto } from '../../../../src/application/dtos/auth/register-user.dto';
import { User, UserRole } from '../../../../src/domain/entities/user.entity';
import { AppError } from '../../../../src/application/errors/AppError';
// import { plainToInstance } from 'class-transformer'; // Нужен для Use Case, но не в тесте напрямую
import { UserResponseDto } from '../../../../src/application/dtos/auth/user-response.dto';

// Группа тестов для RegisterUserUseCase
describe('RegisterUserUseCase', () => {
    // Переменные для моков и тестируемого экземпляра
    let userRepositoryMock: MockProxy<IUserRepository>;
    let passwordHasherMock: MockProxy<IPasswordHasher>;
    let registerUserUseCase: RegisterUserUseCase;

    // Выполняется перед каждым тестом ('it') в этой группе ('describe')
    beforeEach(() => {
        // Создаем "чистые" моки для каждой зависимости
        userRepositoryMock = mock<IUserRepository>();
        passwordHasherMock = mock<IPasswordHasher>();

        // Создаем экземпляр RegisterUserUseCase, внедряя моки вручную
        registerUserUseCase = new RegisterUserUseCase(
            userRepositoryMock,
            passwordHasherMock,
        );
    });

    // Тест успешной регистрации
    it('should register a new user successfully', async () => {
        // --- Arrange (Подготовка) ---
        // Входные данные для Use Case
        const registerDto: RegisterUserDto = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        };

        // Ожидаемый результат хеширования
        const hashedPassword = 'hashed_password_mock';

        // Моделируем объект User, который должен вернуться из репозитория после создания
        const createdUser = new User({
            id: 'generated-user-id-1',
            name: registerDto.name,
            email: registerDto.email,
            passwordHash: hashedPassword, // Хеш будет здесь
            roles: ['ANALYST'] as UserRole[], // Роль по умолчанию
            createdAt: new Date('2023-01-01T10:00:00Z'),
            updatedAt: new Date('2023-01-01T10:00:00Z'),
        });

        // Настраиваем поведение моков:
        // 1. findByEmail возвращает null
        userRepositoryMock.findByEmail
            .calledWith(registerDto.email)
            .mockResolvedValue(null);
        // 2. hash возвращает хеш
        passwordHasherMock.hash
            .calledWith(registerDto.password)
            .mockResolvedValue(hashedPassword);

        // 3. Используем mockImplementation для create с логгированием
        userRepositoryMock.create.mockImplementation(async (data) => {
            console.log(
                '>>> DEBUG: userRepositoryMock.create CALLED with:',
                data,
            ); // Логгируем вызов
            // Простая проверка для уверенности (не обязательно)
            if (data.email !== registerDto.email) {
                throw new Error('Mock create called with unexpected email');
            }
            return createdUser; // Возвращаем наш объект
        });

        // --- Act (Действие) ---
        let result: UserResponseDto | undefined;
        let error: Error | null = null;

        try {
            // Выполняем метод execute тестируемого Use Case
            result = await registerUserUseCase.execute(registerDto);
            // Логгируем результат
            console.log('>>> DEBUG: Result from use case execute:', result);
        } catch (e: unknown) {
            // Ловим любую возможную ошибку
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error(String(e)); // Преобразуем в Error, если это не он
            }
            console.error('>>> DEBUG: Error during execute:', error); // Логгируем ошибку, если она была
        }

        // --- Assert (Проверка) ---
        // 1. Убеждаемся, что во время Act не было выброшено исключение
        expect(error).toBeNull();

        // 2. Проверяем сам результат (должен быть UserResponseDto)
        expect(result).toBeDefined(); // Убеждаемся, что результат не undefined
        // Прерываем тест, если result undefined, чтобы избежать ошибок ниже
        if (!result) {
            console.error('>>> TEST FAILED: result is undefined'); // Доп. лог
            return;
        }

        expect(result).toBeInstanceOf(UserResponseDto); // Проверяем тип (класс) результата
        expect(result.id).toBe(createdUser.id); // Сверяем поля
        expect(result.email).toBe(createdUser.email);
        expect(result.name).toBe(createdUser.name);
        expect(result.roles).toEqual(createdUser.roles); // Используем toEqual для массивов/объектов
        expect(result.createdAt).toEqual(createdUser.createdAt); // Проверяем даты
        expect(result.updatedAt).toEqual(createdUser.updatedAt);
        // Важная проверка: убеждаемся, что хеш пароля не попал в ответ DTO
        expect(result.passwordHash).toBeUndefined();

        // 3. Проверяем, что методы моков были вызваны правильно
        // findByEmail должен быть вызван 1 раз с нужным email
        expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
        expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
            registerDto.email,
        );

        // hash должен быть вызван 1 раз с нужным паролем
        expect(passwordHasherMock.hash).toHaveBeenCalledTimes(1);
        expect(passwordHasherMock.hash).toHaveBeenCalledWith(
            registerDto.password,
        );

        // create должен быть вызван 1 раз (только из execute)
        expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
        // Проверяем, что create был вызван с правильными данными (используем objectContaining)
        expect(userRepositoryMock.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: registerDto.name,
                email: registerDto.email, // Use Case не меняет регистр email
                passwordHash: hashedPassword,
                roles: ['ANALYST'],
            }),
        );
    });

    // Тест случая, когда email уже существует
    it('should throw an AppError if email already exists', async () => {
        // --- Arrange ---
        // Входные данные
        const registerDto: RegisterUserDto = {
            name: 'Another User',
            email: 'existing@example.com',
            password: 'password456',
        };
        // Моделируем существующего пользователя
        const existingUser = new User({
            id: 'existing-user-id-2',
            name: 'Existing User',
            email: registerDto.email,
            passwordHash: 'some_other_hash',
            roles: ['MANAGER'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Настраиваем мок findByEmail: вернуть существующего пользователя
        userRepositoryMock.findByEmail
            .calledWith(registerDto.email)
            .mockResolvedValue(existingUser);

        // --- Act & Assert ---
        // Ожидаем, что вызов execute завершится ошибкой (промис будет отклонен)
        await expect(registerUserUseCase.execute(registerDto))
            .rejects // Ожидаем отклонение промиса
            .toThrow(AppError); // Ожидаем ошибку типа AppError

        // Дополнительно проверяем сообщение и статус код ошибки
        await expect(
            registerUserUseCase.execute(registerDto),
        ).rejects.toMatchObject({
            message: 'Пользователь с таким Email уже существует',
            statusCode: 409,
        });

        // Убеждаемся, что методы hash и create не были вызваны в этом случае
        expect(passwordHasherMock.hash).not.toHaveBeenCalled();
        expect(userRepositoryMock.create).not.toHaveBeenCalled();
        // findByEmail должен был быть вызван
        expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
            registerDto.email,
        );
    });

    // --- Дополнительные тесты (можно добавить позже) ---
    // it('should throw an error if password hashing fails', async () => { ... });
    // it('should throw an error if user creation fails', async () => { ... });
});
