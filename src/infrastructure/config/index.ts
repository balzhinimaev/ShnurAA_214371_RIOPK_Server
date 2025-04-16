// src/infrastructure/config/index.ts
import dotenv from 'dotenv';
dotenv.config(); // Загружает переменные из .env

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    db: {
        name: process.env.MONGO_INIDB_DATABASE || "flproject",
        url:
            process.env.DATABASE_URL ||
            'mongodb://localhost:27017/your_db_name',
    },
    // ... другие конфигурации
};

export default config;
