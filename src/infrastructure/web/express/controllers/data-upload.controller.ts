// src/infrastructure/web/express/controllers/data-upload.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { ProcessInvoiceUploadUseCase } from '../../../../application/use-cases/data-uploads/process-invoice-upload.use-case';
import { AppError } from '../../../../application/errors/AppError';

export class DataUploadController {
    async uploadInvoices(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // Файл должен быть загружен upload.middleware и доступен в req.file
        if (!req.file) {
            return next(new AppError('Файл для загрузки не найден', 400));
        }

        const filePath = req.file.path; // Путь к временному файлу
        const processInvoiceUploadUseCase = container.resolve(
            ProcessInvoiceUploadUseCase,
        );

        try {
            // Запускаем обработку файла
            const result = await processInvoiceUploadUseCase.execute(filePath);

            // Отправляем результат обработки
            res.status(200).json({
                message: 'Файл успешно обработан.',
                ...result, // Добавляем статистику из результата Use Case
            });
        } catch (error) {
            // Передаем ошибки (включая ошибки из Use Case) в error handler
            // Файл должен удаляться в блоке finally в Use Case
            next(error);
        }
    }

    // Можно добавить методы для загрузки других типов данных (платежи, клиенты)
}
