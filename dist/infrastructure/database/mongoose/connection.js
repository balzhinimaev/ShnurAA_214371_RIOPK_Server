"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/database/mongoose/connection.ts
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../../config")); // Наша конфигурация с DB_URL
const connectDB = async () => {
    try {
        mongoose_1.default.set('strictQuery', true); // Рекомендуемая настройка для Mongoose 7+
        console.log(`[DB] Attempting to connect to MongoDB...`);
        console.log(`[DB] Database URL: ${config_1.default.db.url.replace(/\/\/.*@/, '//***:***@')}`); // Скрываем пароль в логах
        console.log(`[DB] Database name: ${config_1.default.db.name}`);
        await mongoose_1.default.connect(config_1.default.db.url, {
            dbName: config_1.default.db.name
        }); // Используем URL из конфига
        // Детальное логирование успешного подключения
        const connection = mongoose_1.default.connection;
        console.log('✅ [DB] MongoDB Connected Successfully');
        console.log(`[DB] Connection state: ${connection.readyState === 1 ? 'connected' : connection.readyState}`);
        console.log(`[DB] Database: ${connection.db?.databaseName || config_1.default.db.name}`);
        console.log(`[DB] Host: ${connection.host || 'unknown'}`);
        console.log(`[DB] Port: ${connection.port || 'unknown'}`);
        // Логирование событий подключения (опционально)
        mongoose_1.default.connection.on('connected', () => {
            console.log('✅ [DB] MongoDB connection established');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error(`❌ [DB] MongoDB connection error: ${err}`);
            process.exit(1); // Выход из приложения при ошибке подключения
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('⚠️ [DB] MongoDB disconnected.');
        });
    }
    catch (error) {
        console.error(`❌ [DB] MongoDB connection error: ${error}`);
        process.exit(1); // Выход из приложения при ошибке подключения
    }
};
exports.default = connectDB;
//# sourceMappingURL=connection.js.map