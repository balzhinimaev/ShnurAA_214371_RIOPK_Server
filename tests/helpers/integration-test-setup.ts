// tests/helpers/integration-test-setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, {
    Connection,
    ConnectOptions,
    ConnectionStates,
} from 'mongoose'; // Импортировали ConnectionStates

// Переменные уровня модуля
let mongod: MongoMemoryServer | undefined;
let mongoUri: string | undefined;
let internalTestConnection: Connection | undefined;

/**
 * Запускает MongoDB в памяти и создает НОВОЕ соединение Mongoose к ней.
 * Предназначена для вызова из jest.setup.ts в beforeAll.
 * @returns {Promise<{ uri: string; connection: Connection }>} URI сервера и созданное соединение.
 */
export const startMongoMemoryServer = async (): Promise<{
    uri: string;
    connection: Connection;
}> => {
    if (
        mongod &&
        internalTestConnection &&
        internalTestConnection.readyState === ConnectionStates.connected
    ) {
        console.log(
            '[SETUP_HELPER] Reusing existing Mongo Memory Server and connection.',
        );
        return { uri: mongoUri!, connection: internalTestConnection };
    }
    if (mongod || internalTestConnection) {
        console.warn(
            '[SETUP_HELPER] Found existing server/connection in unexpected state, cleaning up before restart...',
        );
        await cleanupInternalState();
    }

    console.log('[SETUP_HELPER] Starting MongoDB Memory Server...');
    try {
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log(
            `[SETUP_HELPER] MongoDB Memory Server started at ${mongoUri}`,
        );

        console.log(
            '[SETUP_HELPER] Creating new Mongoose connection for tests...',
        );
        const connectionOptions: ConnectOptions = {};
        internalTestConnection = mongoose.createConnection(
            mongoUri,
            connectionOptions,
        );

        await new Promise<void>((resolve, reject) => {
            const cleanupListeners = () => {
                if (internalTestConnection) {
                    internalTestConnection.removeListener('open', handleOpen);
                    internalTestConnection.removeListener('error', handleError);
                }
            };
            const handleOpen = () => {
                cleanupListeners();
                console.log(
                    '[SETUP_HELPER] Internal test Mongoose connection opened.',
                );
                resolve();
            };
            const handleError = (err: any) => {
                cleanupListeners();
                console.error(
                    '[SETUP_HELPER] Internal test Mongoose connection error:',
                    err,
                );
                cleanupInternalState().catch((e) =>
                    console.error(
                        'Error during cleanup after connection fail',
                        e,
                    ),
                );
                reject(err);
            };
            internalTestConnection!.once('open', handleOpen);
            internalTestConnection!.once('error', handleError);
        });

        return { uri: mongoUri!, connection: internalTestConnection! };
    } catch (error) {
        console.error(
            '[SETUP_HELPER] Error starting MongoDB Memory Server or creating connection:',
            error,
        );
        await cleanupInternalState();
        throw error;
    }
};

/**
 * Очищает базу данных, используя ВНУТРЕННЕЕ соединение.
 * Предназначена для вызова из тестов в beforeEach.
 */
export const clearDatabase = async (): Promise<void> => {
    if (!internalTestConnection) {
        console.warn(
            '[SETUP_HELPER] clearDatabase: Internal connection not available (likely setup failed or not called yet).',
        );
        return;
    }

    const currentState = internalTestConnection.readyState;
    if (currentState !== ConnectionStates.connected) {
        console.warn(
            `[SETUP_HELPER] clearDatabase: Cannot drop database, internal connection not ready (state: ${ConnectionStates[currentState]}). Trying to ensure connection...`,
        );
        try {
            await ensureConnectedInternal();
            // После успешного ensureConnectedInternal, состояние должно быть connected
            console.log(
                `[SETUP_HELPER] clearDatabase: Connection ensured. New state: ${ConnectionStates[internalTestConnection.readyState]}`,
            );
        } catch (connectError) {
            console.error(
                '[SETUP_HELPER] clearDatabase: Failed to ensure connection before clearing:',
                connectError,
            );
            return;
        }
    }

    // Дополнительная проверка на всякий случай
    if (internalTestConnection.readyState !== ConnectionStates.connected) {
        console.error(
            `[SETUP_HELPER] clearDatabase: Connection still not ready after ensure attempt (state: ${ConnectionStates[internalTestConnection.readyState]}). Aborting clear.`,
        );
        return;
    }

    if (!internalTestConnection.db) {
        console.error(
            '[SETUP_HELPER] clearDatabase: internalTestConnection.db is undefined even when connected. Cannot drop database.',
        );
        return;
    }

    console.log(
        '[SETUP_HELPER] clearDatabase: Dropping database using internal connection...',
    );
    try {
        await internalTestConnection!.db.dropDatabase();
        console.log(
            '[SETUP_HELPER] clearDatabase: Database dropped successfully.',
        );
    } catch (error) {
        const isMongoError =
            typeof error === 'object' && error !== null && 'codeName' in error;
        if (
            isMongoError &&
            (error as { codeName: string }).codeName === 'NamespaceNotFound'
        ) {
            console.warn(
                '[SETUP_HELPER] clearDatabase: NamespaceNotFound (database likely already empty), ignoring.',
            );
        } else {
            console.error(
                '[SETUP_HELPER] clearDatabase: Error dropping database:',
                error,
            );
            throw error;
        }
    }
};

/**
 * Внутренняя функция для проверки и восстановления соединения.
 */
const ensureConnectedInternal = async (): Promise<void> => {
    if (!internalTestConnection || !mongoUri) {
        throw new Error(
            '[SETUP_HELPER] ensureConnectedInternal: Connection or URI not initialized.',
        );
    }

    // Если уже подключено, выходим
    if (internalTestConnection.readyState === ConnectionStates.connected)
        return;

    // Если в процессе разрыва, ждем и потом пытаемся подключиться
    if (internalTestConnection.readyState === ConnectionStates.disconnecting) {
        console.log(
            '[SETUP_HELPER] ensureConnectedInternal: Waiting for disconnection to finish...',
        );
        await new Promise<void>((resolve) =>
            internalTestConnection!.once('disconnected', resolve),
        );
    }

    // Если отключено (или только что завершился разрыв)
    if (internalTestConnection.readyState === ConnectionStates.disconnected) {
        console.log(
            '[SETUP_HELPER] ensureConnectedInternal: Re-opening internal connection...',
        );
        try {
            await internalTestConnection!.openUri(mongoUri!, {});
            console.log(
                '[SETUP_HELPER] ensureConnectedInternal: Connection re-opened.',
            );
        } catch (error) {
            console.error(
                '[SETUP_HELPER] ensureConnectedInternal: Error re-opening:',
                error,
            );
            throw error; // Перебрасываем ошибку подключения
        }
    }

    // Если уже в процессе подключения, ждем его завершения
    if (internalTestConnection.readyState === ConnectionStates.connecting) {
        console.log(
            `[SETUP_HELPER] ensureConnectedInternal: Waiting for connection process to finish...`,
        );
        await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(
                () =>
                    reject(
                        new Error(
                            'Timeout waiting for connection state to resolve in ensureConnectedInternal',
                        ),
                    ),
                15000,
            );
            internalTestConnection!.once('open', () => {
                clearTimeout(timeoutId);
                resolve();
            });
            internalTestConnection!.once('error', (err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });
        console.log(
            '[SETUP_HELPER] ensureConnectedInternal: Connection process finished.',
        );
    }

    // Финальная проверка состояния после всех попыток
if (
    ConnectionStates[internalTestConnection.readyState] !==
    ConnectionStates[ConnectionStates.connected]
) {
    throw new Error(
        `[SETUP_HELPER] ensureConnectedInternal: Failed to reach CONNECTED state. Current state: ${ConnectionStates[internalTestConnection.readyState]}`,
    );
}
};

/**
 * Управляет состоянием после теста.
 * Предназначен для вызова из тестов в afterEach.
 */
export const disconnectMongoose = async (): Promise<void> => {
    if (!internalTestConnection) {
        return;
    }
    console.log(
        `[SETUP_HELPER] disconnectMongoose (afterEach): No action needed. Connection state: ${ConnectionStates[internalTestConnection.readyState]}`,
    );
};

/**
 * Останавливает MongoDB в памяти и закрывает ВНУТРЕННЕЕ соединение.
 * Предназначена для вызова из jest.setup.ts в afterAll.
 */
export const stopMongoMemoryServer = async (): Promise<void> => {
    console.log(
        '[SETUP_HELPER] stopMongoMemoryServer: Preparing to stop server and internal connection...',
    );
    await cleanupInternalState();
    console.log('[SETUP_HELPER] stopMongoMemoryServer: Finished.');
};

/**
 * Внутренняя функция для безопасной остановки сервера и закрытия соединения.
 */
const cleanupInternalState = async (): Promise<void> => {
    try {
        if (internalTestConnection) {
            // Используем имя состояния для лога
            console.log(
                `[SETUP_HELPER] Cleanup: Closing internal connection (state: ${ConnectionStates[internalTestConnection.readyState]})`,
            );
            await internalTestConnection.close();
            console.log('[SETUP_HELPER] Cleanup: Internal connection closed.');
        }
    } catch (connError) {
        console.error(
            '[SETUP_HELPER] Cleanup: Error closing Mongoose connection:',
            connError,
        );
    } finally {
        internalTestConnection = undefined;
    }

    try {
        if (mongod) {
            console.log('[SETUP_HELPER] Cleanup: Stopping mongod process...');
            await mongod.stop();
            console.log(
                '[SETUP_HELPER] Cleanup: MongoDB Memory Server stopped.',
            );
        }
    } catch (mongodError) {
        console.error(
            '[SETUP_HELPER] Cleanup: Error stopping MongoDB Memory Server:',
            mongodError,
        );
    } finally {
        mongod = undefined;
        mongoUri = undefined;
    }
};
