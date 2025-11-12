// tests/jest.setup.ts

import 'reflect-metadata';
import { container } from 'tsyringe';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// --- Токены и Реализации для перерегистрации ---
// База данных
import {
    MongooseConnectionToken,
    MongoUserRepository,
} from '../src/infrastructure/database/mongoose/repositories/user.repository';
import {
    UserRepositoryToken,
    IUserRepository,
} from '../src/domain/repositories/IUserRepository';
// Хешер
import {
    PasswordHasherToken,
    IPasswordHasher,
} from '../src/application/interfaces/IPasswordHasher';
import { BcryptPasswordHasher } from '../src/infrastructure/services/bcrypt.password-hasher'; // <-- Убедитесь, что путь правильный
// JWT Сервис
import {
    JwtServiceToken,
    IJwtService,
} from '../src/application/interfaces/IJwtService';
import { JsonWebTokenService } from '../src/infrastructure/services/jsonwebtoken.service'; // <-- Убедитесь, что путь правильный
// ---> ДОБАВЬТЕ ДРУГИЕ РЕПОЗИТОРИИ/СЕРВИСЫ, ЕСЛИ НУЖНЫ <---

// Хелперы
import {
    startMongoMemoryServer,
    stopMongoMemoryServer,
} from './helpers/integration-test-setup';

let mongodInstance: MongoMemoryServer | undefined;
export let testConnection: Connection;

beforeAll(async () => {
    console.log(
        '[JEST_SETUP] Global beforeAll: Starting MongoDB and configuring DI...',
    );
    try {
        const setupResult = await startMongoMemoryServer();
        mongodInstance = setupResult.mongodInstance;
        testConnection = setupResult.connection;

        // 1. Переопределяем соединение БД
        container.registerInstance(MongooseConnectionToken, testConnection);
        console.log(
            `[JEST_SETUP] Overridden DI token ${String(MongooseConnectionToken)} with test connection.`,
        );

        // 2. ЯВНО ПЕРЕРЕГИСТРИРУЕМ ВСЕ НЕОБХОДИМЫЕ ЗАВИСИМОСТИ ДЛЯ ТЕСТОВ
        // Репозиторий
        container.register<IUserRepository>(UserRepositoryToken, {
            useClass: MongoUserRepository,
        });
        console.log(
            `[JEST_SETUP] Re-registered DI token ${String(UserRepositoryToken)}.`,
        );
        // Хешер
        container.register<IPasswordHasher>(PasswordHasherToken, {
            useClass: BcryptPasswordHasher,
        });
        console.log(
            `[JEST_SETUP] Re-registered DI token ${String(PasswordHasherToken)}.`,
        );
        // JWT Сервис
        container.register<IJwtService>(JwtServiceToken, {
            useClass: JsonWebTokenService,
        });
        console.log(
            `[JEST_SETUP] Re-registered DI token ${String(JwtServiceToken)}.`,
        );
        
        // Регистрируем InvoiceRepository для тестов
        const invoiceRepoModule = await import('../src/domain/repositories/IInvoiceRepository');
        const invoiceRepoImpl = await import(
            '../src/infrastructure/database/mongoose/repositories/invoice.repository'
        );
        
        container.register(invoiceRepoModule.InvoiceRepositoryToken, {
            useClass: invoiceRepoImpl.MongoInvoiceRepository,
        });
        console.log(
            `[JEST_SETUP] Re-registered DI token ${String(invoiceRepoModule.InvoiceRepositoryToken)}.`,
        );
        
        // ---> ДОБАВЬТЕ РЕГИСТРАЦИЮ ДРУГИХ ЗАВИСИМОСТЕЙ ЗДЕСЬ <---

        console.log(
            `[JEST_SETUP] Global beforeAll: Test connection state: ${testConnection?.readyState}.`,
        );
        console.log(
            '[JEST_SETUP] Global beforeAll: Setup finished successfully.',
        );
    } catch (error) {
        console.error(
            '[JEST_SETUP] Global beforeAll: CRITICAL SETUP FAILED:',
            error,
        );
        await stopMongoMemoryServer(mongodInstance, testConnection).catch((e) =>
            console.error('Cleanup error:', e),
        );
        process.exit(1);
    }
}, 60000);

afterAll(async () => {
    console.log(
        '[JEST_SETUP] Global afterAll: Stopping MongoDB Memory Server...',
    );
    await stopMongoMemoryServer(mongodInstance, testConnection);
    // Сбрасываем все регистрации контейнера после тестов
    container.reset(); // Используем reset для полной очистки
    console.log(
        '[JEST_SETUP] Global afterAll: Teardown completed and DI container reset.',
    );
}, 60000);
