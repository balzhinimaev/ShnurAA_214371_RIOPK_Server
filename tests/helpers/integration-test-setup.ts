// tests/helpers/integration-test-setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, {
    Connection,
    ConnectOptions
} from 'mongoose';

/**
 * Запускает MongoDB в памяти и создает НОВОЕ соединение Mongoose к ней.
 * @returns {Promise<{ mongodInstance: MongoMemoryServer; connection: Connection; uri: string }>} Экземпляр сервера, созданное соединение и URI.
 */
export const startMongoMemoryServer = async (): Promise<{
    mongodInstance: MongoMemoryServer;
    connection: Connection;
    uri: string;
}> => {
    console.log('[SETUP_HELPER] Starting MongoDB Memory Server...');
    let mongodInstance: MongoMemoryServer | undefined;
    let connection: Connection | undefined;
    let uri: string | undefined;

    try {
        mongodInstance = await MongoMemoryServer.create();
        uri = mongodInstance.getUri();
        console.log(`[SETUP_HELPER] MongoDB Memory Server started at ${uri}`);

        console.log(
            '[SETUP_HELPER] Creating new Mongoose connection for tests...',
        );
        const connectionOptions: ConnectOptions = {};
        connection = mongoose.createConnection(uri, connectionOptions);

        // Используем обработчики промисов для ожидания
        await connection.asPromise();
        console.log('[SETUP_HELPER] Mongoose connection opened.');

        if (!mongodInstance || !connection || !uri) {
            throw new Error(
                'Failed to initialize MongoDB server or connection.',
            );
        }

        return { mongodInstance, connection, uri };
    } catch (error) {
        console.error(
            '[SETUP_HELPER] Error starting MongoDB Memory Server or creating connection:',
            error,
        );
        // Попытка очистить то, что могло создаться
        if (connection)
            await connection
                .close()
                .catch((e) => console.error('Cleanup error (connection):', e));
        if (mongodInstance)
            await mongodInstance
                .stop()
                .catch((e) => console.error('Cleanup error (mongod):', e));
        throw error;
    }
};

/**
 * Очищает базу данных, используя ПЕРЕДАННОЕ соединение.
 * Удаляет все документы из всех коллекций.
 * @param {Connection} connection - Соединение Mongoose для очистки.
 */
export const clearDatabase = async (connection: Connection): Promise<void> => {
    if (!connection) {
        console.warn(
            '[SETUP_HELPER] clearDatabase: Connection object is missing or undefined.',
        );
        return;
    }

    const currentState = connection.readyState;
    // Используем числовое значение 1 для 'connected'
    if (currentState !== 1) {
        console.warn(
            `[SETUP_HELPER] clearDatabase: Cannot clear database, connection not ready (state: ${currentState}).`,
        );
        return;
    }

    if (!connection.db) {
        console.error(
            '[SETUP_HELPER] clearDatabase: connection.db is undefined even when connected. Cannot clear.',
        );
        return;
    }

    console.log('[SETUP_HELPER] clearDatabase: Clearing collections...');
    try {
        const collections = await connection.db.collections();
        const promises = collections.map((collection) =>
            collection.deleteMany({}),
        ); // Готовим промисы для удаления
        await Promise.all(promises); // Выполняем удаление параллельно
        console.log(
            '[SETUP_HELPER] clearDatabase: Collections cleared successfully.',
        );
    } catch (error) {
        console.error(
            '[SETUP_HELPER] clearDatabase: Error clearing collections:',
            error,
        );
        // Не перебрасываем ошибку, чтобы не ломать тесты
    }
};

/**
 * Останавливает MongoDB в памяти и закрывает ПЕРЕДАННОЕ соединение.
 * @param {MongoMemoryServer | undefined} mongodInstance - Экземпляр сервера для остановки.
 * @param {Connection | undefined} connection - Соединение Mongoose для закрытия.
 */
export const stopMongoMemoryServer = async (
    mongodInstance: MongoMemoryServer | undefined,
    connection: Connection | undefined,
): Promise<void> => {
    console.log(
        '[SETUP_HELPER] Stopping MongoDB Memory Server and closing connection...',
    );
    try {
        // Используем числовое значение 1 для 'connected' (как было запрошено "вторую опцию")
        if (connection && connection.readyState === 1) {
            // <--- ИСПОЛЬЗУЕМ 1
            console.log('[SETUP_HELPER] Closing Mongoose connection...');
            await connection.close();
            console.log('[SETUP_HELPER] Mongoose connection closed.');
        } else if (connection) {
            // Логируем текущее состояние числом
            console.log(
                `[SETUP_HELPER] Mongoose connection already closed or not connected (state: ${connection.readyState}).`,
            );
        } else {
            console.log(
                '[SETUP_HELPER] No Mongoose connection provided to stop.',
            );
        }
    } catch (connError) {
        console.error(
            '[SETUP_HELPER] Error closing Mongoose connection:',
            connError,
        );
    }

    try {
        if (mongodInstance) {
            console.log(
                '[SETUP_HELPER] Stopping MongoDB Memory Server process...',
            );
            await mongodInstance.stop();
            console.log('[SETUP_HELPER] MongoDB Memory Server stopped.');
        } else {
            console.log('[SETUP_HELPER] No mongodInstance provided to stop.');
        }
    } catch (mongodError) {
        console.error(
            '[SETUP_HELPER] Error stopping MongoDB Memory Server:',
            mongodError,
        );
    }
    console.log('[SETUP_HELPER] Teardown finished.');
};

// Удаленные функции (больше не нужны в этой реализации):
// - ensureConnectedInternal
// - disconnectMongoose
// - cleanupInternalState
// Удалены переменные уровня модуля:
// - mongod
// - mongoUri
// - internalTestConnection
