// src/infrastructure/database/mongoose/connection.ts
import mongoose from 'mongoose';
import config from '../../config'; // Наша конфигурация с DB_URL

const connectDB = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true); // Рекомендуемая настройка для Mongoose 7+
        
        console.log(`[DB] Attempting to connect to MongoDB...`);
        console.log(`[DB] Database URL: ${config.db.url.replace(/\/\/.*@/, '//***:***@')}`); // Скрываем пароль в логах
        console.log(`[DB] Database name: ${config.db.name}`);
        
        await mongoose.connect(config.db.url, {
            dbName: config.db.name
        }); // Используем URL из конфига
        
        // Детальное логирование успешного подключения
        const connection = mongoose.connection;
        console.log('✅ [DB] MongoDB Connected Successfully');
        console.log(`[DB] Connection state: ${connection.readyState === 1 ? 'connected' : connection.readyState}`);
        console.log(`[DB] Database: ${connection.db?.databaseName || config.db.name}`);
        console.log(`[DB] Host: ${connection.host || 'unknown'}`);
        console.log(`[DB] Port: ${connection.port || 'unknown'}`);

        // Логирование событий подключения (опционально)
        mongoose.connection.on('connected', () => {
            console.log('✅ [DB] MongoDB connection established');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`❌ [DB] MongoDB connection error: ${err}`);
            process.exit(1); // Выход из приложения при ошибке подключения
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ [DB] MongoDB disconnected.');
        });
    } catch (error) {
        console.error(`❌ [DB] MongoDB connection error: ${error}`);
        process.exit(1); // Выход из приложения при ошибке подключения
    }
};

export default connectDB;
