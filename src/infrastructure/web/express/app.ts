// src/infrastructure/web/express/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import 'express-async-errors'; // <--- ИМПОРТИРУЙТЕ ЗДЕСЬ!
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from '../../config';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from '../../../application/errors/AppError';
import swaggerSpec from "../../../swagger.config" 
// import { AppError } from '../../../../application/errors/AppError'; // Импортируем AppError для 404
import swaggerUi from 'swagger-ui-express';
const app: Express = express();

// --- Swagger UI Setup ---
// Путь, по которому будет доступна документация
const swaggerDocsPath = '/api-docs';
app.use(swaggerDocsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log(`Swagger UI available at http://localhost:${config.port}${swaggerDocsPath}`);

// Базовые Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// Настройка CORS с поддержкой credentials и явным указанием origin
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // В development разрешаем все origin, в production нужно указать конкретные
        if (config.env === 'development' || !origin) {
            callback(null, true);
        } else {
            // Здесь можно добавить проверку конкретных origin для production
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 часа
};

app.use(cors(corsOptions));

// Логирование OPTIONS запросов для отладки CORS
if (config.env === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.method === 'OPTIONS') {
            console.log('[CORS] OPTIONS preflight request:', {
                origin: req.headers.origin,
                method: req.method,
                path: req.path,
                headers: req.headers,
            });
        }
        next();
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.env === 'development') {
    app.use(morgan('dev'));
}

// Health Check эндпоинт
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Подключение API роутов (express-async-errors пропатчит обработчики внутри)
app.use(config.apiPrefix, apiRouter);

// Обработчик ненайденных роутов (404) - ДОЛЖЕН БЫТЬ ПОСЛЕ РОУТОВ API
app.use((req: Request, _res: Response, next: NextFunction) => {
    // Используем AppError для единообразия
    next(new AppError(`Ресурс не найден: ${req.originalUrl}`, 404));
});

// Глобальный обработчик ошибок - должен быть САМЫМ ПОСЛЕДНИМ middleware
app.use(errorHandler);

export default app;
