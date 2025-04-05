// src/infrastructure/web/express/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from '../../config';
import apiRouter from './routes'; // Главный роутер API (создадим далее)
// import { errorHandler } from './middlewares/error.middleware'; // Обработчик ошибок (создадим далее)

const app: Express = express();

// Базовые Middlewares
app.use(helmet()); // Заголовки безопасности
app.use(cors()); // Разрешить CORS (настроить опции для прода)
app.use(express.json()); // Парсер JSON тел запросов
app.use(express.urlencoded({ extended: true })); // Парсер URL-encoded тел
if (config.env === 'development') {
    app.use(morgan('dev')); // Логгер запросов для разработки
}

// Health Check эндпоинт
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Подключение API роутов
app.use(config.apiPrefix, apiRouter);

// Обработчик ненайденных роутов (404) - после всех роутов API
app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({ message: 'Not Found' });
});

// Глобальный обработчик ошибок (должен быть последним)
// TODO: Раскомментировать и реализовать error.middleware.ts
// app.use(errorHandler);

// Пока используем простой обработчик
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
