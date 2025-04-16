// src/infrastructure/database/mongoose/connection.ts
import mongoose from 'mongoose';
import config from '../../config'; // Наша конфигурация с DB_URL

const connectDB = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true); // Рекомендуемая настройка для Mongoose 7+
        await mongoose.connect(config.db.url, {
            dbName: config.db.name
        }); // Используем URL из конфига
        console.log('MongoDB Connected Successfully');

        // Логирование событий подключения (опционально)
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
            process.exit(1); // Выход из приложения при ошибке подключения
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected.');
        });
    } catch (error) {
        console.error(`MongoDB connection error: ${error}`);
        process.exit(1); // Выход из приложения при ошибке подключения
    }
};

export default connectDB;
