"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/app.ts
const express_1 = __importDefault(require("express"));
require("express-async-errors"); // <--- ИМПОРТИРУЙТЕ ЗДЕСЬ!
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("../../config"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const AppError_1 = require("../../../application/errors/AppError");
const swagger_config_1 = __importDefault(require("../../../swagger.config"));
// import { AppError } from '../../../../application/errors/AppError'; // Импортируем AppError для 404
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
// --- Swagger UI Setup ---
// Путь, по которому будет доступна документация
const swaggerDocsPath = '/api-docs';
app.use(swaggerDocsPath, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.default));
console.log(`Swagger UI available at http://localhost:${config_1.default.port}${swaggerDocsPath}`);
// Базовые Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));
// Настройка CORS с поддержкой credentials и явным указанием origin
const corsOptions = {
    origin: function (origin, callback) {
        // В development разрешаем все origin, в production нужно указать конкретные
        if (config_1.default.env === 'development' || !origin) {
            callback(null, true);
        }
        else {
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
app.use((0, cors_1.default)(corsOptions));
// Логирование OPTIONS запросов для отладки CORS
if (config_1.default.env === 'development') {
    app.use((req, _res, next) => {
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (config_1.default.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health Check эндпоинт
app.get('/health', (_req, res) => {
    res.status(200).send('OK');
});
// Подключение API роутов (express-async-errors пропатчит обработчики внутри)
app.use(config_1.default.apiPrefix, routes_1.default);
// Обработчик ненайденных роутов (404) - ДОЛЖЕН БЫТЬ ПОСЛЕ РОУТОВ API
app.use((req, _res, next) => {
    // Используем AppError для единообразия
    next(new AppError_1.AppError(`Ресурс не найден: ${req.originalUrl}`, 404));
});
// Глобальный обработчик ошибок - должен быть САМЫМ ПОСЛЕДНИМ middleware
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map