// tests/integration/auth.integration.test.ts
import 'reflect-metadata'; // Обязательно для tsyringe! Импортировать первым.
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../src/infrastructure/config';

// Импортируем ваше Express приложение
import app from '../../src/infrastructure/web/express/app';

// Импортируем хелпер для очистки БД
import { clearDatabase } from '../helpers/integration-test-setup';

// --- Глобальное тестовое соединение (Импортируем из jest.setup) ---
import { testConnection } from '../jest.setup';

// --- Модель для прямых проверок БД (если нужно) ---
let UserModelTest: mongoose.Model<any>;

// --- Настройка перед всеми тестами в этом файле ---
beforeAll(async () => {
    if (!testConnection) {
        throw new Error(
            'Global test connection is not available. Check jest.setup.ts.',
        );
    }
    try {
        if (testConnection.models['User']) {
            UserModelTest = testConnection.model('User');
        } else {
            const { UserSchema } = await import(
                '../../src/infrastructure/database/mongoose/schemas/user.schema'
            );
            UserModelTest = testConnection.model('User', UserSchema);
        }
        console.log(
            '[auth.integration.test] UserModelTest obtained successfully.',
        );
    } catch (e) {
        console.error(
            '[auth.integration.test] Failed to get UserModelTest:',
            e,
        );
        throw new Error(
            'Could not obtain UserModelTest for integration tests.',
        );
    }
});

describe('Auth API Integration Tests', () => {
    // Define test users for each test suite to avoid conflicts
    const registerTestUser = {
        name: 'Register Test User',
        email: 'register.test@example.com',
        password: 'Password123!',
    };

    const loginTestUser = {
        name: 'Login Test User',
        email: 'login.test@example.com',
        password: 'Password123!',
    };

    const meTestUser = {
        name: 'Me Test User',
        email: 'me.test@example.com',
        password: 'Password123!',
    };

    // Global clean up before all tests
    beforeAll(async () => {
        if (!testConnection) {
            throw new Error('Test connection is not available');
        }
        // Clear the database once before all tests
        await clearDatabase(testConnection);
    });

    // ======================================
    // == Тесты для POST /api/v1/auth/register ==
    // ======================================
    describe('POST /api/v1/auth/register', () => {
        // Clear DB before register tests
        beforeAll(async () => {
            if (!testConnection) return;
            await clearDatabase(testConnection);
        });

        it('should register a new user successfully and return user data without password hash', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(registerTestUser);

            expect(response.status).toBe(201);
            expect(response.body.email).toBe(
                registerTestUser.email.toLowerCase(),
            );
            expect(response.body).not.toHaveProperty('passwordHash');

            if (!UserModelTest)
                throw new Error('UserModelTest not initialized');
            const savedUser = await UserModelTest.findOne({
                email: registerTestUser.email.toLowerCase(),
            }).exec();
            expect(savedUser).not.toBeNull();
            if (savedUser) {
                const isMatch = await bcrypt.compare(
                    registerTestUser.password,
                    savedUser.passwordHash,
                );
                expect(isMatch).toBe(true);
            }
        });

        it('should return 409 Conflict if email already exists', async () => {
            // --- Arrange ---
            const existingEmail = 'existing-for-409@example.com';
            // 1. СОЗДАЕМ существующего пользователя ПРЯМО ЗДЕСЬ
            await request(app).post('/api/v1/auth/register').send({
                name: 'Existing 409 User',
                email: existingEmail,
                password: 'password123',
            });
            // Можно добавить проверку, что он создался (опционально)
            const userCheck = await UserModelTest.findOne({
                email: existingEmail.toLowerCase(),
            });
            expect(userCheck).not.toBeNull();

            // 2. Готовим DTO для второго запроса с тем же email
            const duplicateUserDto = {
                name: 'Duplicate Test User',
                email: existingEmail, // <-- Тот же email
                password: 'AnotherPassword456',
            };

            // --- Act ---
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(duplicateUserDto);

            // --- Assert ---
            expect(response.status).toBe(409); // Теперь ожидаем 409
            expect(response.body.message).toContain('Email уже существует');

            // Убедимся, что в базе остался только один пользователь с этим email
            const usersInDb = await UserModelTest.find({
                email: existingEmail.toLowerCase(),
            }).exec();
            expect(usersInDb).toHaveLength(1);
            expect(usersInDb[0].name).toBe('Existing 409 User'); // Проверяем имя первого
        });

        it('should return 400 Bad Request for invalid input data (e.g., missing password)', async () => {
            const invalidUserDto = { name: 'Invalid', email: 'invalid@a.com' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidUserDto);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(JSON.stringify(response.body)).toMatch(
                /Пароль не может быть пустым|password should not be empty/i,
            );
        });

        it('should return 400 Bad Request for invalid email format', async () => {
            const invalidUserDto = {
                name: 'Invalid Email',
                email: 'invalid-email',
                password: 'password123',
            };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidUserDto);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(JSON.stringify(response.body)).toMatch(
                /Некорректный формат Email|email must be an email/i,
            );
        });

        it('should return 400 Bad Request for short password', async () => {
            const invalidUserDto = {
                name: 'Short PW',
                email: 'shortpw@example.com',
                password: '123',
            }; // Пароль < 6 символов
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidUserDto);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(JSON.stringify(response.body)).toMatch(
                /Пароль должен быть не менее 6 символов|password must be longer than or equal to 6 characters/i,
            );
        });
    });

    // ======================================
    // == Тесты для POST /api/v1/auth/login ==
    // ======================================
    describe('POST /api/v1/auth/login', () => {
        let loginUserId: string;

        // Set up the login test user before login tests
        beforeAll(async () => {
            // Create a specific user for login tests to avoid conflicts
            if (!UserModelTest) {
                throw new Error('UserModelTest not initialized');
            }

            // Clear existing user with this email if it exists
            await UserModelTest.deleteOne({
                email: loginTestUser.email.toLowerCase(),
            });

            // Register user directly via API
            const regResponse = await request(app)
                .post('/api/v1/auth/register')
                .send(loginTestUser);

            expect(regResponse.status).toBe(201);
            loginUserId = regResponse.body.id;

            // Verify user exists in DB
            const userInDb = await UserModelTest.findOne({
                email: loginTestUser.email.toLowerCase(),
            });

            if (!userInDb) {
                throw new Error(
                    `Failed to create login test user: ${loginTestUser.email}`,
                );
            }

            console.log(`Login test user created with ID: ${loginUserId}`);
        });

        it('should login successfully with correct credentials and return token and user data', async () => {
            const loginDto = {
                email: loginTestUser.email,
                password: loginTestUser.password,
            };

            // Verify the user exists in the database before attempting login
            if (!UserModelTest) {
                throw new Error('UserModelTest not initialized');
            }

            const userInDb = await UserModelTest.findOne({
                email: loginDto.email.toLowerCase(),
            });

            if (!userInDb) {
                throw new Error(
                    `User ${loginDto.email} not found before login test`,
                );
            }

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginDto);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(typeof response.body.accessToken).toBe('string');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.id).toBe(loginUserId);
            expect(response.body.user.email).toBe(
                loginTestUser.email.toLowerCase(),
            );
            expect(response.body.user.name).toBe(loginTestUser.name);
            expect(response.body.user).not.toHaveProperty('passwordHash');

            // Опциональная проверка JWT
            try {
                const decoded = jwt.verify(
                    response.body.accessToken,
                    config.jwt.secret,
                ) as jwt.JwtPayload;
                expect(decoded.sub).toBe(loginUserId);
                expect(decoded.roles).toEqual(['ANALYST']); // Проверяем роли в токене
            } catch (err) {
                fail('Generated JWT token is invalid or unverifiable');
            }
        });

        it('should return 401 for incorrect password', async () => {
            const loginDto = {
                email: loginTestUser.email,
                password: 'IncorrectPassword', // Неверный пароль
            };
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginDto);

            expect(response.status).toBe(401);
            expect(response.body.message).toContain(
                'Неверный email или пароль',
            );
        });

        it('should return 401 for non-existent email', async () => {
            const loginDto = {
                email: 'nonexistent@example.com', // Несуществующий email
                password: 'anypassword',
            };
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginDto);

            expect(response.status).toBe(401);
            expect(response.body.message).toContain(
                'Неверный email или пароль',
            );
        });

        it('should return 400 for invalid login dto (missing email)', async () => {
            const loginDto = {
                // email отсутствует
                password: loginTestUser.password,
            };
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send(loginDto);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(JSON.stringify(response.body)).toMatch(
                /Email не может быть пустым|email should not be empty/i,
            );
        });
    });

    // ======================================
    // == Тесты для GET /api/v1/auth/me    ==
    // ======================================
    describe('GET /api/v1/auth/me', () => {
        let meUserId: string;
        let meUserToken: string;

        // Create a user for /me tests
        beforeAll(async () => {
            if (!testConnection) {
                throw new Error('Test connection is not available');
            }

            // Make sure the user doesn't exist already
            if (UserModelTest) {
                await UserModelTest.deleteOne({
                    email: meTestUser.email.toLowerCase(),
                });
            }

            // Register the user
            const regResponse = await request(app)
                .post('/api/v1/auth/register')
                .send(meTestUser);

            expect(regResponse.status).toBe(201);
            meUserId = regResponse.body.id;

            // Login to get a valid token
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: meTestUser.email,
                    password: meTestUser.password,
                });

            expect(loginResponse.status).toBe(200);
            meUserToken = loginResponse.body.accessToken;

            console.log(`Me test user created with ID: ${meUserId}`);
        });

        // If your /me endpoint is not implemented yet, comment out this test
        it('should return current user data with valid token', async () => {
            // Verify your endpoint path - it might be different or not implemented yet
            // If it's returning 404, you might need to check your routes configuration

            // IMPORTANT: If the /me endpoint is not implemented yet, comment out this test
            // or use the next test as a placeholder

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${meUserToken}`);

            // If your endpoint exists but returns a different status code,
            // update the expected status code
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(meUserId);
            expect(response.body.email).toBe(meTestUser.email.toLowerCase());
            expect(response.body.name).toBe(meTestUser.name);
            expect(response.body.roles).toEqual(['ANALYST']);
            expect(response.body).not.toHaveProperty('passwordHash');
            expect(response.body).not.toHaveProperty('password');
        });

        // If your /me endpoint is not implemented yet, use this test instead
        // and comment out the previous test
        /*
        it('should return current user data with valid token', async () => {
            // Skip this test if the endpoint is not implemented yet
            console.log("NOTE: Skipping /me test as the endpoint appears to not be implemented yet.");
            
            // The /me endpoint might not be implemented yet if it's returning 404
            // This is a placeholder test to remind you to implement the endpoint
            pending('The /me endpoint is not implemented yet. Once implemented, update this test.');
        });
        */

        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/api/v1/auth/me');

            // If the endpoint isn't implemented yet, this will return 404 instead of 401
            // If that's the case, adjust this test accordingly
            expect(response.status).toBe(401);

            // If your endpoint doesn't exist yet (404), comment this out
            expect(response.body.message).toMatch(
                /Отсутствует или неверный формат токена/i,
            );
        });

        it('should return 401 if token is invalid (malformed)', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer this-is-not-a-valid-jwt');

            // If the endpoint isn't implemented yet, this will return 404 instead of 401
            // If that's the case, adjust this test accordingly
            expect(response.status).toBe(401);

            // If your endpoint doesn't exist yet (404), comment this out
            expect(response.body.message).toMatch(
                /Невалидный или истекший токен|Ошибка авторизации/i,
            );
        });

        it('should return 401 if token is signed with wrong secret', async () => {
            const payload = { sub: meUserId, roles: ['ANALYST'] };
            const wrongSecret =
                'a-completely-different-secret-than-the-real-one';
            const invalidSignatureToken = jwt.sign(payload, wrongSecret, {
                expiresIn: '1h',
            });

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${invalidSignatureToken}`);

            // If the endpoint isn't implemented yet, this will return 404 instead of 401
            // If that's the case, adjust this test accordingly
            expect(response.status).toBe(401);

            // If your endpoint doesn't exist yet (404), comment this out
            expect(response.body.message).toMatch(
                /Невалидный или истекший токен|Ошибка авторизации/i,
            );
        });
    });
});
