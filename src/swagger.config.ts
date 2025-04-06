// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs'; // Импортируем модуль Node.js для работы с файловой системой
import path from 'path'; // Импортируем модуль Node.js для работы с путями
import config from './infrastructure/config';
// import config from '../infrastructure/config'; // Импортируем основной конфиг для порта и префикса

/**
 * Синхронно читает файл package.json и возвращает значение поля version.
 * @returns Строка с версией приложения или '1.0.0' в случае ошибки.
 */
function getPackageVersion(): string {
    try {
        // Строим абсолютный путь к package.json
        // __dirname в ES модулях не всегда доступен так же, как в CommonJS,
        // но ts-node обычно предоставляет его. Альтернатива - process.cwd().
        // Для большей надежности используем path.resolve относительно текущего файла.
        // __dirname будет указывать на 'y:/.../ShnurAA_214371_RIOPK_Server/src/config'
        const packageJsonPath = path.resolve(__dirname, '../package.json'); // Поднимаемся на 2 уровня до корня проекта

        // Проверяем существование файла перед чтением
        if (!fs.existsSync(packageJsonPath)) {
            console.error(
                `package.json not found at expected path: ${packageJsonPath}`,
            );
            return '1.0.0';
        }

        // Читаем содержимое файла синхронно
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
        // Парсим JSON
        const packageJsonData = JSON.parse(packageJsonContent);
        // Возвращаем версию или дефолтное значение, если поле version отсутствует
        return packageJsonData.version || '1.0.0';
    } catch (error) {
        console.error('Could not read version from package.json:', error);
        // Возвращаем дефолтное значение при любой ошибке чтения или парсинга
        return '1.0.0';
    }
}

// Опции для swagger-jsdoc
const options: swaggerJsdoc.Options = {
    // --- Основная информация об API ---
    definition: {
        openapi: '3.0.0', // Версия спецификации OpenAPI
        info: {
            title: 'Receivables Analyzer API', // Название API
            version: getPackageVersion(), // Получаем версию с помощью нашей функции
            description: 'API для сервиса анализа дебиторской задолженности',
        },
        // Список серверов, где доступно API
        servers: [
            {
                url: `http://localhost:${config.port}${config.apiPrefix}`, // Формируем URL из конфига
                description: 'Локальный сервер разработки',
            },
        ],
        // --- Компоненты спецификации (схемы, безопасность и т.д.) ---
        components: {
            // Описание схемы безопасности для JWT Bearer токена
            securitySchemes: {
                bearerAuth: {
                    // Название этой схемы используется в секции security
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Введите JWT токен в формате Bearer <token>',
                },
            },
            // Определения общих схем данных (DTO будут добавлены из аннотаций)
            schemas: {
                // Общая схема для ошибок
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['error', 'fail'], // Возможные статусы ответа
                            example: 'error',
                        },
                        message: {
                            type: 'string',
                            example: 'Сообщение об ошибке',
                        },
                    },
                    required: ['status', 'message'], // Обязательные поля
                },
                // Схема для ошибок валидации
                ValidationErrorResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error',
                        },
                        message: {
                            type: 'string',
                            // Пример показывает, как могут быть объединены ошибки
                            example:
                                'Ошибка валидации: Некорректный формат Email; Отсутствует пароль',
                        },
                    },
                    required: ['status', 'message'],
                },
                // Сюда автоматически добавятся схемы из аннотаций в файлах DTO
                // (например, RegisterUserDto, LoginResponseDto и т.д.)
            },
        },
        // --- Глобальная схема безопасности ---
        // Указываем, что по умолчанию все эндпоинты требуют аутентификации по схеме 'bearerAuth'.
        // Публичные эндпоинты (login, register) должны будут явно указать 'security: []' в своих аннотациях.
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // --- Пути к файлам с аннотациями OpenAPI (JSDoc) ---
    // Указываются относительно корня проекта, где будет запускаться генерация
    apis: [
        './src/infrastructure/web/express/routes/**/*.routes.ts', // Все файлы роутов
        './src/application/dtos/**/*.dto.ts', // Все файлы DTO
    ],
};

// Генерируем спецификацию Swagger/OpenAPI
let swaggerSpec: object | undefined;
try {
    // swaggerJsdoc читает файлы по путям в apis и извлекает аннотации
    swaggerSpec = swaggerJsdoc(options);
    console.log('Swagger spec generated successfully.'); // Лог успеха
} catch (error) {
    // Логируем ошибку, если генерация не удалась (например, из-за ошибок в аннотациях)
    console.error('Error generating Swagger spec:', error);
    // swaggerSpec останется undefined
}

// Экспортируем сгенерированную спецификацию (или undefined в случае ошибки)
export default swaggerSpec;
