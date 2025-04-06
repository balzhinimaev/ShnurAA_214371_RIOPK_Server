// src/infrastructure/web/express/routes/data-upload.routes.ts
import { Router } from 'express';
import { DataUploadController } from '../controllers/data-upload.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingleFile } from '../middlewares/upload.middleware'; // Наш middleware для multer

const router = Router();
const dataUploadController = new DataUploadController();

// --- Применяем middleware аутентификации ко всем роутам в этом файле ---
// Это гарантирует, что только аутентифицированные пользователи могут загружать данные.
router.use(authMiddleware);

// --- Описание эндпоинта загрузки счетов ---
/**
 * @openapi
 * /data-uploads/invoices:
 *   post:
 *     tags:
 *       - Загрузка Данных
 *     summary: Загрузка CSV файла со счетами
 *     description: Принимает CSV файл в формате multipart/form-data, парсит его и создает соответствующие записи счетов и клиентов (при необходимости) в системе. Возвращает статистику по обработке файла.
 *     security:
 *       - bearerAuth: [] # Указываем, что для этого эндпоинта требуется аутентификация Bearer
 *     requestBody:
 *       description: Тело запроса должно содержать CSV файл.
 *       required: true
 *       content:
 *         multipart/form-data: # Обязательно указываем этот тип контента для файлов
 *           schema:
 *             type: object
 *             properties:
 *               file: # Имя поля формы, которое ожидает multer ('file')
 *                 type: string
 *                 format: binary # Стандартный способ обозначить файл в OpenAPI 3.0
 *                 description: > # Используем '>' для многострочного описания без лишних пробелов
 *                   CSV файл со счетами для загрузки. Обязательные заголовки:
 *                   InvoiceNumber, CustomerName, CustomerINN, IssueDate, DueDate, TotalAmount.
 *                   Опциональный заголовок: PaidAmount.
 *             required:
 *               - file # Поле 'file' является обязательным
 *     responses:
 *       '200': # Используем кавычки для кодов ответа для единообразия
 *         description: Файл успешно принят и обработан (возможны ошибки по отдельным строкам, см. поле 'errors' в ответе).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Файл успешно обработан.
 *                 # Используем allOf для объединения message и результата обработки
 *                 allOf:
 *                   - $ref: '#/components/schemas/ProcessUploadResult' # Ссылка на схему с результатами
 *       '400':
 *         description: Ошибка в запросе - файл не предоставлен, неверный тип файла (не CSV), или ошибка парсинга заголовков CSV.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' # Ссылка на общую схему ошибки
 *       '401':
 *         description: Ошибка авторизации - пользователь не аутентифицирован (JWT токен отсутствует или невалиден).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Внутренняя ошибка сервера во время обработки файла.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/invoices', // Путь относительно префикса /api/v1/data-uploads
    uploadSingleFile, // Middleware от multer для обработки поля 'file'
    dataUploadController.uploadInvoices, // Обработчик контроллера
);

// Сюда можно будет добавить роуты для загрузки других типов данных, например:
// router.post('/payments', uploadSingleFile, dataUploadController.uploadPayments);
// router.post('/customers', uploadSingleFile, dataUploadController.uploadCustomers);

// Экспортируем роутер для подключения в главном файле роутов (routes/index.ts)
export default router;
