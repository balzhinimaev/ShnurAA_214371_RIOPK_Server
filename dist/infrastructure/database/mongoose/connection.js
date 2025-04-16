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
        await mongoose_1.default.connect(config_1.default.db.url, {
            dbName: config_1.default.db.name
        }); // Используем URL из конфига
        console.log('MongoDB Connected Successfully');
        // Логирование событий подключения (опционально)
        mongoose_1.default.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
            process.exit(1); // Выход из приложения при ошибке подключения
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('MongoDB disconnected.');
        });
    }
    catch (error) {
        console.error(`MongoDB connection error: ${error}`);
        process.exit(1); // Выход из приложения при ошибке подключения
    }
};
exports.default = connectDB;
//# sourceMappingURL=connection.js.map