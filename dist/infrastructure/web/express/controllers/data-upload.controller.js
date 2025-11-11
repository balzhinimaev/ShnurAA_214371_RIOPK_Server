"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataUploadController = void 0;
const tsyringe_1 = require("tsyringe");
const process_invoice_upload_use_case_1 = require("../../../../application/use-cases/data-uploads/process-invoice-upload.use-case");
const process_1c_invoice_upload_use_case_1 = require("../../../../application/use-cases/data-uploads/process-1c-invoice-upload.use-case");
const AppError_1 = require("../../../../application/errors/AppError");
class DataUploadController {
    async uploadInvoices(req, res, next) {
        // 1. Проверяем наличие файла
        if (!req.file) {
            // Ошибка от multer или файл не был отправлен
            return next(new AppError_1.AppError('Файл для загрузки не найден или не соответствует требованиям.', 400));
        }
        // 2. Получаем ID пользователя из req.user (установленного authMiddleware)
        const userId = req.user?.id;
        if (!userId) {
            // Эта проверка важна на случай проблем с authMiddleware
            console.error('[DataUploadController] User ID not found in req.user after authMiddleware.');
            return next(new AppError_1.AppError('Ошибка аутентификации: не удалось определить пользователя.', 401));
        }
        // 3. Получаем путь к загруженному файлу
        const filePath = req.file.path;
        if (!filePath) {
            // На всякий случай, если multer отработал, но путь не записался
            console.error('[DataUploadController] File path is missing in req.file after upload.');
            return next(new AppError_1.AppError('Ошибка загрузки файла: путь к файлу отсутствует.', 500));
        }
        try {
            // 4. Получаем экземпляр Use Case из DI контейнера
            const processInvoiceUploadUseCase = tsyringe_1.container.resolve(process_invoice_upload_use_case_1.ProcessInvoiceUploadUseCase);
            // 5. Запускаем обработку файла, передавая путь и ID пользователя
            const result = await processInvoiceUploadUseCase.execute(filePath, userId);
            // 6. Отправляем успешный результат обработки клиенту
            res.status(200).json({
                message: 'Файл успешно обработан.', // Или можно взять сообщение из result, если оно там есть
                ...result, // Добавляем статистику (totalRows, processedRows, errors и т.д.)
            });
        }
        catch (error) {
            // 7. Передаем любые ошибки (из Use Case или другие) в глобальный error handler
            // Важно: Use Case должен сам позаботиться об удалении временного файла в блоке finally
            console.error('[DataUploadController] Error during invoice upload execution:', error);
            next(error);
        }
    }
    async upload1cInvoices(req, res, next) {
        // 1. Проверяем наличие файла
        if (!req.file) {
            return next(new AppError_1.AppError('Файл для загрузки не найден или не соответствует требованиям.', 400));
        }
        // 2. Получаем ID пользователя из req.user (установленного authMiddleware)
        const userId = req.user?.id;
        if (!userId) {
            console.error('[DataUploadController] User ID not found in req.user after authMiddleware.');
            return next(new AppError_1.AppError('Ошибка аутентификации: не удалось определить пользователя.', 401));
        }
        // 3. Получаем путь к загруженному файлу
        const filePath = req.file.path;
        if (!filePath) {
            console.error('[DataUploadController] File path is missing in req.file after upload.');
            return next(new AppError_1.AppError('Ошибка загрузки файла: путь к файлу отсутствует.', 500));
        }
        try {
            // 4. Получаем экземпляр Use Case из DI контейнера
            const process1cInvoiceUploadUseCase = tsyringe_1.container.resolve(process_1c_invoice_upload_use_case_1.Process1cInvoiceUploadUseCase);
            // 5. Запускаем обработку файла, передавая путь и ID пользователя
            const result = await process1cInvoiceUploadUseCase.execute(filePath, userId);
            // 6. Отправляем успешный результат обработки клиенту
            res.status(200).json({
                message: 'Файл 1C успешно обработан.',
                ...result,
            });
        }
        catch (error) {
            // 7. Передаем любые ошибки в глобальный error handler
            console.error('[DataUploadController] Error during 1C invoice upload execution:', error);
            next(error);
        }
    }
}
exports.DataUploadController = DataUploadController;
//# sourceMappingURL=data-upload.controller.js.map