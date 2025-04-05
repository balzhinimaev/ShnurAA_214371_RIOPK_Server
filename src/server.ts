// src/server.ts
import 'reflect-metadata';
import './infrastructure/di/container.config';

import app from './infrastructure/web/express/app';
import config from './infrastructure/config';
import connectDB from './infrastructure/database/mongoose/connection';

const startServer = async () => {
    try {
        await connectDB(); // Вызываем подключение к БД перед запуском сервера

        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
            console.log(
                `API available at http://localhost:${config.port}${config.apiPrefix}`,
            );
            console.log(`Environment: ${config.env}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Выход из процесса при ошибке старта
    }
};

startServer();
