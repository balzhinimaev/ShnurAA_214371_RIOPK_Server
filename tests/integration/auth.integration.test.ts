// tests/integration/auth.integration.test.ts
import 'reflect-metadata'; // Обязательно для tsyringe! Импортировать первым.
import request from 'supertest';
import mongoose, { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

// Импортируем ваше Express приложение
import app from '../../src/infrastructure/web/express/app'; // <--- Проверьте правильность пути

// Импортируем DI контейнер и токен соединения
import container from '../../src/infrastructure/di/container.config'; // <--- Проверьте правильность пути
import { MongooseConnectionToken } from '../../src/infrastructure/database/mongoose/repositories/user.repository'; // <--- Проверьте правильность пути

// Импортируем схему/модель напрямую для проверок БД (хотя лучше через connection.model)
// import { UserModel } from '../../src/infrastructure/database/mongoose/schemas/user.schema'; // <--- Можно, но ниже будет лучше

// --- Переменные для тестового окружения ---
let mongoServer: MongoMemoryServer;
let testConnection: Connection; // Отдельное соединение для тестов
let UserModelTest: mongoose.Model<any>; // Модель, привязанная к ТЕСТОВОМУ соединению

// --- Настройка тестового окружения ---
beforeAll(async () => {
    const setupId = `SETUP_${Date.now()}`;
    console.log(`---- [${setupId}] BEFORE_ALL START ----`);

    // 1. Запускаем MongoDB в памяти
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log(`[${setupId}] MongoMemoryServer started at: ${mongoUri}`);

    // 2. Создаем НОВОЕ соединение Mongoose для тестов
    testConnection = mongoose.createConnection(mongoUri);

    // Добавим обработчики событий для отладки соединения
    testConnection.on('connected', () =>
        console.log(`[${setupId}] Test connection OPEN to ${mongoUri}`),
    );
    testConnection.on('error', (err) =>
        console.error(`[${setupId}] Test connection ERROR: ${err}`),
    );
    testConnection.on('disconnected', () =>
        console.log(`[${setupId}] Test connection DISCONNECTED`),
    );

    // Дождемся открытия соединения
    await testConnection.asPromise(); // Важно дождаться готовности
    console.log(
        `[${setupId}] Test connection readyState: ${testConnection.readyState}`,
    );

    // Добавим ID для логирования внутри репозитория
    (testConnection as any)._instanceIdFromSetup = setupId;

    // 3. --- КЛЮЧЕВОЙ МОМЕНТ: Переопределение зависимости в DI контейнере ---
    // Теперь любой класс, который запрашивает @inject(MongooseConnectionToken),
    // получит НАШЕ тестовое соединение `testConnection`.
    container.register(MongooseConnectionToken, { useValue: testConnection });
    console.log(
        `[${setupId}] DI Container overridden: MongooseConnectionToken now uses TEST connection.`,
    );

    // 4. Получаем модель, привязанную к тестовому соединению (для очистки/проверок)
    // Убедимся, что схема регистрируется или используется существующая
    if (testConnection.models['User']) {
        UserModelTest = testConnection.model('User');
        console.log(
            `[${setupId}] Reused existing model 'User' from TEST connection.`,
        );
    } else {
        // Импортируем саму схему для регистрации на тестовом соединении
        const { UserSchema } = await import(
            '../../src/infrastructure/database/mongoose/schemas/user.schema'
        ); // <--- Проверьте путь
        UserModelTest = testConnection.model('User', UserSchema);
        console.log(
            `[${setupId}] Registered and obtained model 'User' from TEST connection.`,
        );
    }

    // 5. Очистка данных перед всеми тестами (на всякий случай)
    try {
        await UserModelTest.deleteMany({});
        console.log(
            `[${setupId}] Initial cleanup of 'users' collection successful.`,
        );
    } catch (e) {
        console.error(`[${setupId}] Error during initial cleanup:`, e);
    }

    console.log(`---- [${setupId}] BEFORE_ALL END ----`);
});

// --- Завершение работы тестового окружения ---
afterAll(async () => {
    const teardownId = `TEARDOWN_${Date.now()}`;
    console.log(`---- [${teardownId}] AFTER_ALL START ----`);
    // 1. Закрываем тестовое соединение
    if (testConnection) {
        await testConnection.close();
        console.log(
            `[${teardownId}] Test connection closed. readyState: ${testConnection?.readyState}`,
        );
    }
    // 2. Останавливаем сервер MongoDB
    if (mongoServer) {
        await mongoServer.stop();
        console.log(`[${teardownId}] MongoMemoryServer stopped.`);
    }
    // 3. Сбрасываем регистрации контейнера (важно, если тесты запускаются не изолированно)
    container.clearInstances(); // Сбрасывает синглтоны
    // или container = new container.createChildContainer() если нужно полное разделение

    console.log(`---- [${teardownId}] AFTER_ALL END ----`);
});

// --- Очистка между тестами ---
afterEach(async () => {
    const cleanupId = `CLEANUP_${Date.now()}`;
    // Очищаем коллекцию пользователей через модель тестового соединения
    if (UserModelTest) {
        try {
            await UserModelTest.deleteMany({});
            console.log(
                `[${cleanupId}] afterEach: Cleaned 'users' collection.`,
            );
        } catch (e) {
            console.error(
                `[${cleanupId}] afterEach: Error cleaning 'users' collection`,
                e,
            );
        }
    }
});

// --- Сами тесты ---
describe('Auth API - /api/v1/auth/login', () => {
    describe('POST /register', () => {
        it('should register a new user successfully and return user data without password hash', async () => {
            // --- Arrange ---
            const newUserDto = {
                name: 'Integration Test User',
                email: 'integration.test@example.com',
                password: 'StrongPassword123',
            };

            // --- Act ---
            const response = await request(app) // Используем наше Express приложение
                .post('/api/v1/auth/register') // Путь к эндпоинту
                .send(newUserDto); // Отправляем DTO

            // --- Assert: HTTP Response ---
            expect(response.status).toBe(201); // Статус "Created"
            expect(response.body).toBeDefined();
            expect(response.body).toHaveProperty('id'); // Должен быть ID
            expect(response.body.name).toBe(newUserDto.name);
            expect(response.body.email).toBe(newUserDto.email.toLowerCase()); // Email приводится к нижнему регистру
            expect(response.body).toHaveProperty('roles'); // Должны быть роли
            expect(response.body.roles).toEqual(['ANALYST']); // Роль по умолчанию
            expect(response.body).not.toHaveProperty('password'); // НЕ ДОЛЖЕН содержать пароль
            expect(response.body).not.toHaveProperty('passwordHash'); // НЕ ДОЛЖЕН содержать хеш пароля

            // --- Assert: Database State ---
            // Используем МОДЕЛЬ ТЕСТОВОГО СОЕДИНЕНИЯ для проверки
            const savedUser = await UserModelTest.findOne({
                email: newUserDto.email.toLowerCase(),
            }).exec(); // Не используем lean(), чтобы проверить полный документ, если нужно

            expect(savedUser).not.toBeNull(); // Пользователь должен быть найден в БД
            if (savedUser) {
                expect(savedUser.name).toBe(newUserDto.name);
                expect(savedUser.email).toBe(newUserDto.email.toLowerCase());
                expect(savedUser.passwordHash).toBeDefined(); // Хеш должен быть в БД
                expect(savedUser.passwordHash).not.toBe(newUserDto.password); // Хеш не равен паролю

                // Проверяем, что хеш соответствует паролю
                const isMatch = await bcrypt.compare(
                    newUserDto.password,
                    savedUser.passwordHash,
                );
                expect(isMatch).toBe(true); // Пароль должен совпадать с хешем

                expect(savedUser.roles).toEqual(['ANALYST']); // Проверяем роли в БД
            } else {
                // Явно проваливаем тест, если пользователь не найден
                fail('User was not found in the database after registration.');
            }
        });

        it('should return 409 Conflict if email already exists', async () => {
            // --- Arrange ---
            // 1. Создаем первого пользователя напрямую в тестовой БД
            const existingUser = {
                name: 'Existing User',
                email: 'existing.user@example.com',
                password: 'password123',
            };
            const hashedPassword = await bcrypt.hash(existingUser.password, 10);
            await UserModelTest.create({
                // Используем UserModelTest
                name: existingUser.name,
                email: existingUser.email,
                passwordHash: hashedPassword,
                roles: ['MANAGER'], // Зададим другую роль для проверки
            });

            // 2. Готовим DTO для второго запроса с тем же email
            const duplicateUserDto = {
                name: 'Duplicate Test User',
                email: existingUser.email, // <-- Тот же email
                password: 'AnotherPassword456',
            };

            // --- Act ---
            // Пытаемся зарегистрировать пользователя с существующим email
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(duplicateUserDto);

            // --- Assert: HTTP Response ---
            expect(response.status).toBe(409); // Ожидаем статус "Conflict"
            expect(response.body).toBeDefined();
            expect(response.body.message).toContain('Email уже существует'); // Проверяем сообщение об ошибке

            // --- Assert: Database State ---
            // Убедимся, что в базе остался только ОДИН пользователь с этим email
            const usersInDb = await UserModelTest.find({
                email: existingUser.email,
            }).exec();
            expect(usersInDb).toHaveLength(1); // Должен быть только один
            // Убедимся, что это именно первый пользователь (не перезаписался)
            expect(usersInDb[0].name).toBe(existingUser.name);
            expect(usersInDb[0].roles).toEqual(['MANAGER']);
        });

        it('should return 400 Bad Request for invalid input data (e.g., missing password)', async () => {
            // --- Arrange ---
            const invalidUserDto = {
                name: 'Invalid Data User',
                email: 'invalid.data@example.com',
                // password отсутствует
            };

            // --- Act ---
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidUserDto);

            // --- Assert: HTTP Response ---
            // Точный статус зависит от вашего validationMiddleware и errorHandler
            // Обычно это 400 Bad Request
            expect(response.status).toBe(400);
            expect(response.body).toBeDefined();
            // Ожидаем массив ошибок валидации или общее сообщение
            expect(response.body.errors).toBeDefined(); // Если ваш errorHandler возвращает поле errors
            // Можно проверить конкретную ошибку
            expect(JSON.stringify(response.body)).toContain(
                'Пароль не может быть пустым',
            ); // Зависит от сообщения в DTO

            // --- Assert: Database State ---
            // Убедимся, что пользователь НЕ был создан
            const userCount = await UserModelTest.countDocuments({
                email: invalidUserDto.email,
            });
            expect(userCount).toBe(0);
        });

        // TODO: Добавить другие тесты (невалидный email, короткий пароль и т.д.)
    });

    // TODO: Добавить describe блок для 'POST /login'
    // describe('POST /login', () => { ... });
});
