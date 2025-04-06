// tests/jest.setup.ts
import 'reflect-metadata'; // Необходимо для tsyringe
import { container } from 'tsyringe';
import { Connection } from 'mongoose';

// --- Импортируйте ваш токен для соединения Mongoose ---
// Пример: Замените на ваш реальный путь и имя токена
import { MongooseConnectionToken } from '../src/infrastructure/database/mongoose/repositories/user.repository';

// --- Импортируйте хелперы ---
import {
    startMongoMemoryServer,
    stopMongoMemoryServer,
} from './helpers/integration-test-setup'; // <-- УКАЖИ ПРАВИЛЬНЫЙ ПУТЬ

// Переменная для хранения тестового соединения
// Экспортируем ее, чтобы тесты могли ее использовать для компиляции моделей
export let testConnection: Connection;

// Глобальная настройка перед всеми тестами
beforeAll(async () => {
    console.log(
        '[JEST_SETUP] Global beforeAll: Starting MongoDB and configuring DI...',
    );
    try {
        // 1. Запускаем сервер и получаем соединение из хелпера
        const setupResult = await startMongoMemoryServer();
        testConnection = setupResult.connection; // Сохраняем соединение

        // 2. Регистрируем тестовое соединение в DI контейнере
        // Используйте метод вашего DI контейнера (registerInstance, bind/toConstantValue и т.д.)
        container.registerInstance(MongooseConnectionToken, testConnection);

        console.log(
            `[JEST_SETUP] Global beforeAll: Test connection (State: ${testConnection.readyState}) registered in DI container under token ${String(MongooseConnectionToken)}.`,
        );
        console.log(
            '[JEST_SETUP] Global beforeAll: Setup finished successfully.',
        );
    } catch (error) {
        console.error(
            '[JEST_SETUP] Global beforeAll: CRITICAL SETUP FAILED:',
            error,
        );
        // Попытка очистки, если что-то пошло не так
        await stopMongoMemoryServer().catch((e) =>
            console.error(
                '[JEST_SETUP] Error during cleanup after failed setup:',
                e,
            ),
        );
        // Завершаем процесс Jest с ошибкой, т.к. тесты не могут быть выполнены
        process.exit(1);
    }
    // Увеличиваем таймаут для beforeAll, т.к. запуск сервера может занять время
}, 60000); // 60 секунд

// Глобальная очистка после всех тестов
afterAll(async () => {
    console.log(
        '[JEST_SETUP] Global afterAll: Stopping MongoDB Memory Server...',
    );
    try {
        await stopMongoMemoryServer(); // Вызывает хелпер для остановки
        console.log(
            '[JEST_SETUP] Global afterAll: MongoDB Memory Server stopped successfully.',
        );
    } catch (error) {
        console.error('[JEST_SETUP] Global afterAll: Teardown failed:', error);
    }
    // Увеличиваем таймаут и для afterAll
}, 60000); // 60 секунд
