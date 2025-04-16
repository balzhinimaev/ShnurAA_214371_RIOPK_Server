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
        // 1. Проверяем наличие файла
        if (!req.file) {
            // Ошибка от multer или файл не был отправлен
            return next(
                new AppError(
                    'Файл для загрузки не найден или не соответствует требованиям.',
                    400,
                ),
            );
        }

        // 2. Получаем ID пользователя из req.user (установленного authMiddleware)
        const userId = req.user?.id;
        if (!userId) {
            // Эта проверка важна на случай проблем с authMiddleware
            console.error(
                '[DataUploadController] User ID not found in req.user after authMiddleware.',
            );
            return next(
                new AppError(
                    'Ошибка аутентификации: не удалось определить пользователя.',
                    401,
                ),
            );
        }

        // 3. Получаем путь к загруженному файлу
        const filePath = req.file.path;
        if (!filePath) {
            // На всякий случай, если multer отработал, но путь не записался
            console.error(
                '[DataUploadController] File path is missing in req.file after upload.',
            );
            return next(
                new AppError(
                    'Ошибка загрузки файла: путь к файлу отсутствует.',
                    500,
                ),
            );
        }

        try {
            // 4. Получаем экземпляр Use Case из DI контейнера
            const processInvoiceUploadUseCase = container.resolve(
                ProcessInvoiceUploadUseCase,
            );

            // 5. Запускаем обработку файла, передавая путь и ID пользователя
            const result = await processInvoiceUploadUseCase.execute(
                filePath,
                userId,
            );

            // 6. Отправляем успешный результат обработки клиенту
            res.status(200).json({
                message: 'Файл успешно обработан.', // Или можно взять сообщение из result, если оно там есть
                ...result, // Добавляем статистику (totalRows, processedRows, errors и т.д.)
            });
        } catch (error) {
            // 7. Передаем любые ошибки (из Use Case или другие) в глобальный error handler
            // Важно: Use Case должен сам позаботиться об удалении временного файла в блоке finally
            console.error(
                '[DataUploadController] Error during invoice upload execution:',
                error,
            );
            next(error);
        }
    }

    // Сюда можно добавить методы для загрузки других типов данных, например:
    // async uploadPayments(req: Request, res: Response, next: NextFunction): Promise<void> { ... }
}
