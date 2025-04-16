"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Загружает переменные из .env
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
        url: process.env.DATABASE_URL ||
            'mongodb://localhost:27017/your_db_name',
    },
    // ... другие конфигурации
};
exports.default = config;
//# sourceMappingURL=index.js.map