// src/application/use-cases/data-uploads/process-invoice-upload.use-case.ts
import { injectable, inject } from 'tsyringe';
import fs from 'fs'; // Для чтения/удаления файла
import Papa from 'papaparse'; // Для парсинга CSV
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository'; // Базовый интерфейс
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository'; // Базовый интерфейс
import { Customer } from '../../../domain/entities/customer.entity';
import {
    Invoice,
    InvoiceStatus,
} from '../../../domain/entities/invoice.entity';
import { AppError } from '../../errors/AppError'; // Наш класс ошибки приложения
import { InvoiceCsvRowDto } from '../../dtos/data-uploads/invoice-csv-row.dto'; // DTO для строки CSV
import { isValid, parse, parseISO } from 'date-fns'; // Для работы с датами

// Интерфейс для возвращаемого результата обработки файла
/**
 * @openapi
 * components:
 *   schemas:
 *     ProcessUploadResult:
 *       type: object
 *       properties:
 *         totalRows:
 *           type: integer
 *           description: Общее количество непустых строк данных в файле (не считая заголовок).
 *           example: 100
 *         processedRows:
 *           type: integer
 *           description: Количество строк, по которым были успешно созданы/обновлены счета.
 *           example: 95
 *         createdCustomers:
 *           type: integer
 *           description: Количество новых клиентов, созданных во время обработки.
 *           example: 10
 *         createdInvoices:
 *           type: integer
 *           description: Количество новых счетов, созданных во время обработки.
 *           example: 95
 *         updatedInvoices:
 *           type: integer
 *           description: Количество обновленных счетов (если реализовано, пока 0).
 *           example: 0
 *         skippedRows:
 *           type: integer
 *           description: Количество строк, пропущенных из-за ошибок валидации или обработки.
 *           example: 5
 *         errors:
 *           type: array
 *           description: Список сообщений об ошибках, возникших при обработке строк.
 *           items:
 *             type: string
 *             example: "Строка 5: Ошибка валидации: Некорректный формат даты оплаты (DueDate)"
 *       required:
 *         - totalRows
 *         - processedRows
 *         - createdCustomers
 *         - createdInvoices
 *         - updatedInvoices
 *         - skippedRows
 *         - errors
 */
export interface ProcessUploadResult {
    totalRows: number; // Всего строк в файле (не считая пустые и заголовок)
    processedRows: number; // Строк успешно обработано (созданы или обновлены счета)
    createdCustomers: number; // Создано новых клиентов
    createdInvoices: number; // Создано новых счетов
    updatedInvoices: number; // Обновлено существующих счетов (пока 0)
    skippedRows: number; // Строк пропущено из-за ошибок валидации или обработки
    errors: string[]; // Массив сообщений об ошибках по строкам
}

// --- Интерфейсы репозиториев с необходимыми методами (для type hinting) ---
interface ICustomerRepositoryExtended extends ICustomerRepository {
    findByInn(inn: string): Promise<Customer | null>;
    create(data: {
        name: string;
        inn?: string;
        contactInfo?: string;
    }): Promise<Customer>;
}
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    create(
        data: Omit<
            Invoice,
            | 'id'
            | 'customer'
            | 'createdAt'
            | 'updatedAt'
            | 'outstandingAmount'
            | 'isOverdue'
        >,
    ): Promise<Invoice>;
    findByInvoiceNumberAndCustomerId(
        invoiceNumber: string,
        customerId: string,
    ): Promise<Invoice | null>;
}
// ---------------------------------------------------------

@injectable() // Делаем Use Case доступным для DI
export class ProcessInvoiceUploadUseCase {
    // Счетчики для статистики
    private createdCustomersCount = 0;
    private createdInvoicesCount = 0;
    private updatedInvoicesCount = 0;
    private skippedRowsCount = 0;
    private rowErrors: string[] = []; // Массив для сбора ошибок по строкам

    // Внедряем репозитории через DI, используя расширенные интерфейсы для подсказок типов
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepositoryExtended,
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    /**
     * Обрабатывает загруженный CSV файл со счетами.
     * @param filePath Путь к временному файлу CSV, загруженному multer'ом.
     * @returns Объект с результатом обработки.
     */
    async execute(filePath: string): Promise<ProcessUploadResult> {
        this.resetState(); // Сбрасываем состояние перед каждой обработкой
        let totalRows = 0; // Общее количество строк для статистики

        try {
            // 1. Читаем содержимое файла
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            // 2. Парсим CSV с помощью PapaParse
            const parseResult = await this.parseCsv(fileContent);

            // Сохраняем ошибки парсинга, если они были
            parseResult.errors.forEach((err) =>
                this.rowErrors.push(
                    `Ошибка парсинга CSV: ${err.message || 'Неизвестная ошибка'} (строка ${err.row})`,
                ),
            );

            const rowsToProcess = parseResult.data;
            totalRows = rowsToProcess.length; // Получаем количество непустых строк данных

            // Определяем начальный индекс строки для сообщений об ошибках (2 если был заголовок, иначе 1)
            let currentRowIndex = parseResult.meta.fields ? 2 : 1;

            // 3. Последовательно обрабатываем каждую строку данных
            for (const row of rowsToProcess) {
                try {
                    // Обрабатываем одну строку (валидация, поиск/создание клиента, создание счета)
                    await this.processRow(row, currentRowIndex);
                } catch (error: unknown) {
                    // Ловим ошибки обработки конкретной строки
                    let errorMessage = 'Неизвестная ошибка обработки';
                    if (error instanceof Error) {
                        errorMessage = error.message;
                    } else if (typeof error === 'string') {
                        errorMessage = error;
                    }
                    console.error(
                        `Error processing row ${currentRowIndex}:`,
                        error,
                    ); // Логируем ошибку
                    this.skippedRowsCount++; // Увеличиваем счетчик пропущенных строк
                    this.rowErrors.push(
                        `Строка ${currentRowIndex}: ${errorMessage}`,
                    ); // Добавляем ошибку в список
                }
                currentRowIndex++; // Переходим к следующему номеру строки
            }

            // 4. Возвращаем итоговую статистику
            return this.getFinalResult(totalRows);
        } catch (error: unknown) {
            // Ловим общие ошибки (чтение файла, парсинг заголовков и т.д.)
            let errorMessage = 'Неизвестная ошибка обработки файла';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            console.error('Error processing upload file:', error); // Логируем общую ошибку
            // Перебрасываем ошибку как AppError для обработки в контроллере
            throw new AppError(`Ошибка обработки файла: ${errorMessage}`, 500);
        } finally {
            // 5. Пытаемся удалить временный файл независимо от результата обработки
            this.tryDeleteFile(filePath);
        }
    }

    /** Сбрасывает внутреннее состояние Use Case перед обработкой нового файла. */
    private resetState(): void {
        this.createdCustomersCount = 0;
        this.createdInvoicesCount = 0;
        this.updatedInvoicesCount = 0;
        this.skippedRowsCount = 0;
        this.rowErrors = [];
    }

    /** Формирует итоговый объект с результатами обработки. */
    private getFinalResult(totalRows: number): ProcessUploadResult {
        return {
            totalRows: totalRows,
            processedRows: totalRows - this.skippedRowsCount, // Успешно обработанные = Всего - Пропущенные
            createdCustomers: this.createdCustomersCount,
            createdInvoices: this.createdInvoicesCount,
            updatedInvoices: this.updatedInvoicesCount,
            skippedRows: this.skippedRowsCount,
            errors: this.rowErrors,
        };
    }

    /**
     * Асинхронно парсит содержимое CSV файла.
     * @param fileContent - Строковое содержимое CSV файла.
     * @returns Промис с результатом парсинга PapaParse.
     * @rejects {Error} Если отсутствуют необходимые заголовки или произошла ошибка парсинга.
     */
    private parseCsv(
        fileContent: string,
    ): Promise<Papa.ParseResult<InvoiceCsvRowDto>> {
        return new Promise((resolve, reject) => {
            Papa.parse<InvoiceCsvRowDto>(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                /**
                 * Колбэк, вызываемый после успешного парсинга всего файла.
                 * @param results - Объект с результатами парсинга (данные, ошибки, метаинформация).
                 */
                complete: (results: Papa.ParseResult<InvoiceCsvRowDto>) => {
                    // <-- ВОССТАНОВЛЕННЫЙ КОД ЗДЕСЬ
                    // Проверяем наличие обязательных заголовков
                    const requiredHeaders = [
                        'InvoiceNumber',
                        'CustomerName',
                        'CustomerINN',
                        'IssueDate',
                        'DueDate',
                        'TotalAmount',
                    ];
                    const actualHeaders = results.meta.fields; // Получаем фактические заголовки

                    if (
                        !actualHeaders ||
                        !requiredHeaders.every((h) => actualHeaders.includes(h))
                    ) {
                        console.error('Actual CSV Headers:', actualHeaders);
                        // Если заголовки не совпадают, отклоняем промис
                        return reject(
                            new Error(
                                `Отсутствуют необходимые заголовки в CSV. Ожидались: ${requiredHeaders.join(', ')}`,
                            ),
                        );
                    }
                    // Дополнительно фильтруем строки, которые PapaParse мог оставить как объекты с пустыми значениями
                    results.data = results.data.filter((row) =>
                        Object.values(row).some(
                            (val) => val != null && String(val).trim() !== '',
                        ),
                    );

                    // Если все хорошо, разрешаем промис с результатами
                    resolve(results);
                },
                // Используем базовый тип Error
                error: (error: Error) => {
                    // <-- ИЗМЕНЕНО ЗДЕСЬ
                    console.error('PapaParse Error:', error);
                    reject(new Error(`Ошибка парсинга CSV: ${error.message}`));
                },
            });
        });
    }

    /**
     * Обрабатывает одну строку данных из CSV: валидирует, ищет/создает клиента, создает счет.
     * @param row - Объект с данными строки CSV.
     * @param rowIndex - Номер строки в исходном файле (для сообщений об ошибках).
     * @throws {Error} Если данные строки невалидны или не удалось создать/найти сущности.
     */
    private async processRow(
        row: InvoiceCsvRowDto,
        rowIndex: number,
    ): Promise<void> {
        // 1. Валидация и преобразование типов данных строки
        const validatedData = this.validateAndTransformRow(row, rowIndex);

        // 2. Поиск или создание клиента по ИНН
        const customer = await this.findOrCreateCustomer(
            validatedData.customerInn,
            validatedData.customerName,
            rowIndex,
        );

        // 3. Проверка на дубликат счета (по номеру счета и ID клиента)
        const existingInvoice =
            await this.invoiceRepository.findByInvoiceNumberAndCustomerId(
                validatedData.invoiceNumber,
                customer.id,
            );
        if (existingInvoice) {
            // Если счет уже существует, выбрасываем ошибку (можно изменить логику на обновление)
            throw new Error(
                `Счет с номером ${validatedData.invoiceNumber} для клиента ${customer.name} (ID: ${customer.id}) уже существует.`,
            );
        }

        // 4. Подготовка данных для создания нового счета
        const newInvoiceData = {
            invoiceNumber: validatedData.invoiceNumber,
            customerId: customer.id, // Используем ID найденного/созданного клиента
            issueDate: validatedData.issueDate,
            dueDate: validatedData.dueDate,
            totalAmount: validatedData.totalAmount,
            paidAmount: validatedData.paidAmount,
            status: 'OPEN' as InvoiceStatus, // Новый счет всегда OPEN
        };

        // 5. Создание счета через репозиторий
        await this.invoiceRepository.create(newInvoiceData);
        this.createdInvoicesCount++; // Увеличиваем счетчик созданных счетов
    }

    /**
     * Валидирует строковые данные из CSV и преобразует их в нужные типы (Date, number).
     * @param row - Объект с данными строки CSV.
     * @param rowIndex - Номер строки для сообщений об ошибках.
     * @returns Объект с валидированными и преобразованными данными.
     * @throws {Error} Если валидация не пройдена.
     */
    private validateAndTransformRow(row: InvoiceCsvRowDto, _rowIndex: number) {
        const errors: string[] = []; // Массив для сбора ошибок валидации строки

        // Проверка наличия обязательных полей (и удаляем пробелы)
        const invoiceNumber = row.InvoiceNumber?.trim();
        const customerName = row.CustomerName?.trim();
        const customerInn = row.CustomerINN?.trim();
        const issueDateStr = row.IssueDate?.trim();
        const dueDateStr = row.DueDate?.trim();
        const totalAmountStr = row.TotalAmount?.trim();
        const paidAmountStr = row.PaidAmount?.trim(); // Опционально

        if (!invoiceNumber)
            errors.push('Отсутствует номер счета (InvoiceNumber)');
        if (!customerName)
            errors.push('Отсутствует имя клиента (CustomerName)');
        if (!customerInn) errors.push('Отсутствует ИНН клиента (CustomerINN)');
        if (!issueDateStr)
            errors.push('Отсутствует дата выставления (IssueDate)');
        if (!dueDateStr) errors.push('Отсутствует дата оплаты (DueDate)');
        if (!totalAmountStr)
            errors.push('Отсутствует сумма счета (TotalAmount)');

        // Парсинг и валидация чисел (заменяем запятые на точки)
        const totalAmount = parseFloat(totalAmountStr?.replace(',', '.') || '');
        if (isNaN(totalAmount) || totalAmount <= 0)
            errors.push('Некорректная сумма счета (TotalAmount)');

        const paidAmount = parseFloat(paidAmountStr?.replace(',', '.') || '0'); // По умолчанию 0, если пусто
        if (isNaN(paidAmount) || paidAmount < 0)
            errors.push('Некорректная оплаченная сумма (PaidAmount)');

        // Парсинг и валидация дат
        const issueDate = this.parseDate(issueDateStr);
        if (!issueDate)
            errors.push('Некорректный формат даты выставления (IssueDate)');

        const dueDate = this.parseDate(dueDateStr);
        if (!dueDate) errors.push('Некорректный формат даты оплаты (DueDate)');

        // Проверка логики дат
        if (issueDate && dueDate && dueDate < issueDate)
            errors.push(
                'Дата оплаты (DueDate) не может быть раньше даты выставления (IssueDate)',
            );

        // Если были ошибки валидации, выбрасываем их все сразу
        if (errors.length > 0) {
            throw new Error(`Ошибки валидации: ${errors.join('; ')}`);
        }

        // Возвращаем объект с преобразованными типами
        return {
            invoiceNumber: invoiceNumber!, // ! - уверены, что не null после проверки
            customerName: customerName!,
            customerInn: customerInn!,
            issueDate: issueDate!,
            dueDate: dueDate!,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
        };
    }

    /**
     * Пытается распарсить дату из строки, поддерживая несколько форматов.
     * @param dateString - Строка с датой.
     * @returns Объект Date или null, если парсинг не удался.
     */
    private parseDate(dateString: string | undefined | null): Date | null {
        if (!dateString) return null; // Если строка пустая или null/undefined
        const trimmedDate = dateString.trim();
        // Порядок форматов важен
        const formatsToTry = [
            (d: string) => parseISO(d), // ISO формат (YYYY-MM-DD или с временем)
            (d: string) => parse(d, 'yyyy-MM-dd', new Date()), // Явный YYYY-MM-DD
            (d: string) => parse(d, 'dd.MM.yyyy', new Date()), // Формат DD.MM.YYYY
            (d: string) => parse(d, 'MM/dd/yyyy', new Date()), // Формат MM/DD/YYYY
            // Добавьте другие популярные форматы при необходимости
        ];

        for (const parser of formatsToTry) {
            try {
                const parsed = parser(trimmedDate);
                // Проверяем, что результат является валидной датой
                if (isValid(parsed)) {
                    return parsed; // Возвращаем первый успешно распарсенный результат
                }
            } catch (e) {
                // Игнорируем ошибки парсинга для текущего формата и пробуем следующий
            }
        }
        return null; // Если ни один формат не подошел
    }

    /**
     * Находит клиента по ИНН или создает нового, если не найден.
     * Используется для связи счета с клиентом.
     * @param inn - ИНН клиента из CSV.
     * @param name - Имя клиента из CSV.
     * @param rowIndex - Номер строки для логгирования.
     * @returns Промис с найденным или созданным объектом Customer.
     * @throws {Error} Если не удалось ни найти, ни создать клиента.
     */
    private async findOrCreateCustomer(
        inn: string,
        name: string,
        rowIndex: number,
    ): Promise<Customer> {
        // Пытаемся найти клиента по ИНН
        let customer = await this.customerRepository.findByInn(inn);
        if (customer) {
            // Клиент найден, проверяем имя на всякий случай
            if (customer.name !== name) {
                // Имена различаются - логируем предупреждение, но используем существующего клиента
                console.warn(
                    `Row ${rowIndex}: Customer INN ${inn} found, but name differs (DB: '${customer.name}', CSV: '${name}'). Using existing customer ID ${customer.id}.`,
                );
                // Можно добавить в this.rowErrors как предупреждение
                // this.rowErrors.push(`Строка ${rowIndex}: Предупреждение - ИНН ${inn} найден, но имя клиента в файле ('${name}') отличается от имени в базе ('${customer.name}').`);
            }
            return customer; // Возвращаем найденного клиента
        } else {
            // Клиент с таким ИНН не найден, создаем нового
            try {
                const newCustomer = await this.customerRepository.create({
                    name,
                    inn,
                });
                this.createdCustomersCount++; // Увеличиваем счетчик
                console.log(
                    `Row ${rowIndex}: Created new customer '${name}' with INN ${inn} (ID: ${newCustomer.id})`,
                );
                return newCustomer; // Возвращаем созданного клиента
            } catch (createError: unknown) {
                // Ловим ошибки при создании
                let errorMessage = 'Неизвестная ошибка при создании клиента';
                if (createError instanceof Error) {
                    errorMessage = createError.message;
                } else if (typeof createError === 'string') {
                    errorMessage = createError;
                }
                console.error(
                    `Row ${rowIndex}: Failed to create customer INN ${inn}, Name ${name}`,
                    createError,
                );
                // Делаем последнюю попытку найти клиента (на случай гонки запросов при создании)
                customer = await this.customerRepository.findByInn(inn);
                if (customer) {
                    console.warn(
                        `Row ${rowIndex}: Found customer INN ${inn} on retry after creation error.`,
                    );
                    return customer; // Нашли! Возвращаем его
                }
                // Если и повторный поиск не удался, выбрасываем ошибку
                throw new Error(
                    `Не удалось найти или создать клиента с ИНН ${inn}. Причина: ${errorMessage}`,
                );
            }
        }
    }

    /** Пытается удалить временный файл. */
    private tryDeleteFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                // Проверяем, существует ли файл
                fs.unlinkSync(filePath); // Удаляем синхронно
                console.log(`Temporary file deleted: ${filePath}`);
            }
        } catch (unlinkError: unknown) {
            let errorMessage = 'Неизвестная ошибка при удалении файла';
            if (unlinkError instanceof Error) {
                errorMessage = unlinkError.message;
            } else if (typeof unlinkError === 'string') {
                errorMessage = unlinkError;
            }
            // Ошибка удаления файла не критична для основной операции, просто логируем
            console.error(
                `Error deleting temporary file ${filePath}: ${errorMessage}`,
                unlinkError,
            );
        }
    }
}
