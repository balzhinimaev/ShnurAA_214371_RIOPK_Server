// src/infrastructure/web/express/middlewares/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Модуль для работы с файловой системой Node.js
import { AppError } from '../../../../application/errors/AppError';

// --- Конфигурация хранилища ---

// Определяем папку для временного хранения загруженных файлов
// Лучше вынести в конфигурацию (.env), но пока можно так
const UPLOAD_DIR = path.resolve(__dirname, '../../../../../uploads'); // Папка 'uploads' в корне проекта

// Убедимся, что папка для загрузок существует, если нет - создаем
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`Upload directory created: ${UPLOAD_DIR}`);
    } catch (err) {
        console.error('Could not create upload directory:', err);
        // Если не можем создать папку, приложение не сможет работать с файлами
        process.exit(1);
    }
}

const storage = multer.diskStorage({
    // Куда сохранять файл
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR); // Сохраняем в нашу папку 'uploads'
    },
    // Как назвать файл
    filename: (_req, file, cb) => {
        // Генерируем уникальное имя файла, чтобы избежать коллизий
        // Формат: fieldname-timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname); // Получаем расширение файла
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
});

// --- Конфигурация фильтра файлов ---

const fileFilter = (
    _req: Express.Request, // Используем тип из Express
    file: Express.Multer.File, // Используем тип файла из Multer
    cb: multer.FileFilterCallback,
) => {
    // Проверяем тип файла (MIME type) или расширение
    // Разрешаем только CSV файлы
    if (
        file.mimetype === 'text/csv' ||
        file.originalname.toLowerCase().endsWith('.csv')
    ) {
        cb(null, true); // Принять файл
    } else {
        // Отклонить файл с ошибкой
        cb(
            new AppError(
                'Неверный тип файла. Пожалуйста, загрузите CSV файл.',
                400,
            ),
        );
    }
};

// --- Создание экземпляра multer ---

const upload = multer({
    storage: storage, // Используем настроенное хранилище
    fileFilter: fileFilter, // Используем настроенный фильтр
    limits: {
        fileSize: 1024 * 1024 * 10, // Ограничение размера файла (например, 10 МБ)
    },
});

// Экспортируем middleware для использования в роутах
// `.single('file')` означает, что мы ожидаем один файл в поле с именем 'file'
export const uploadSingleFile = upload.single('file');

// Можно также экспортировать сам настроенный multer, если нужны другие методы (.array, .fields)
// export default upload;
