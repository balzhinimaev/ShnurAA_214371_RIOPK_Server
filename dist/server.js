"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
require("reflect-metadata");
require("./infrastructure/di/container.config");
const app_1 = __importDefault(require("./infrastructure/web/express/app"));
const config_1 = __importDefault(require("./infrastructure/config"));
const connection_1 = __importDefault(require("./infrastructure/database/mongoose/connection"));
const startServer = async () => {
    try {
        await (0, connection_1.default)(); // Вызываем подключение к БД перед запуском сервера
        app_1.default.listen(config_1.default.port, () => {
            console.log(`Server running on port ${config_1.default.port}`);
            console.log(`API available at http://localhost:${config_1.default.port}${config_1.default.apiPrefix}`);
            console.log(`Environment: ${config_1.default.env}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Выход из процесса при ошибке старта
    }
};
startServer();
//# sourceMappingURL=server.js.map