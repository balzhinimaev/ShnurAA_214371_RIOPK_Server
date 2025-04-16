"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleFile = void 0;
// src/infrastructure/web/express/middlewares/upload.middleware.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs")); // Модуль для работы с файловой системой Node.js
const AppError_1 = require("../../../../application/errors/AppError");
// --- Конфигурация хранилища ---
// Определяем папку для временного хранения загруженных файлов
// Лучше вынести в конфигурацию (.env), но пока можно так
const UPLOAD_DIR = path_1.default.resolve(__dirname, '../../../../../uploads'); // Папка 'uploads' в корне проекта
// Убедимся, что папка для загрузок существует, если нет - создаем
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    try {
        fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`Upload directory created: ${UPLOAD_DIR}`);
    }
    catch (err) {
        console.error('Could not create upload directory:', err);
        // Если не можем создать папку, приложение не сможет работать с файлами
        process.exit(1);
    }
}
const storage = multer_1.default.diskStorage({
    // Куда сохранять файл
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR); // Сохраняем в нашу папку 'uploads'
    },
    // Как назвать файл
    filename: (_req, file, cb) => {
        // Генерируем уникальное имя файла, чтобы избежать коллизий
        // Формат: fieldname-timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path_1.default.extname(file.originalname); // Получаем расширение файла
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
});
// --- Конфигурация фильтра файлов ---
const fileFilter = (_req, // Используем тип из Express
file, // Используем тип файла из Multer
cb) => {
    // Проверяем тип файла (MIME type) или расширение
    // Разрешаем только CSV файлы
    if (file.mimetype === 'text/csv' ||
        file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true); // Принять файл
    }
    else {
        // Отклонить файл с ошибкой
        cb(new AppError_1.AppError('Неверный тип файла. Пожалуйста, загрузите CSV файл.', 400));
    }
};
// --- Создание экземпляра multer ---
const upload = (0, multer_1.default)({
    storage: storage, // Используем настроенное хранилище
    fileFilter: fileFilter, // Используем настроенный фильтр
    limits: {
        fileSize: 1024 * 1024 * 10, // Ограничение размера файла (например, 10 МБ)
    },
});
// Экспортируем middleware для использования в роутах
// `.single('file')` означает, что мы ожидаем один файл в поле с именем 'file'
exports.uploadSingleFile = upload.single('file');
// Можно также экспортировать сам настроенный multer, если нужны другие методы (.array, .fields)
// export default upload;
//# sourceMappingURL=upload.middleware.js.map