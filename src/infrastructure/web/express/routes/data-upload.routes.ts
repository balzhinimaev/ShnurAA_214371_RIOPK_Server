// src/infrastructure/web/express/routes/data-upload.routes.ts
import { Router } from 'express';
import { DataUploadController } from '../controllers/data-upload.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingleFile } from '../middlewares/upload.middleware'; // Наш middleware для multer

const router = Router();
const dataUploadController = new DataUploadController();

// Защищаем все роуты загрузки
router.use(authMiddleware);

// POST /api/v1/data-uploads/invoices
router.post(
    '/invoices',
    uploadSingleFile, // Сначала multer обрабатывает файл
    dataUploadController.uploadInvoices, // Затем вызывается наш контроллер
);

// Сюда можно добавить роуты для загрузки других данных

export default router;
