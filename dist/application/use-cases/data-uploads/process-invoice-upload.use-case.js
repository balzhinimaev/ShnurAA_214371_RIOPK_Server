"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessInvoiceUploadUseCase = void 0;
// src/application/use-cases/data-uploads/process-invoice-upload.use-case.ts
const tsyringe_1 = require("tsyringe");
const fs_1 = __importDefault(require("fs"));
const papaparse_1 = __importDefault(require("papaparse"));
const ICustomerRepository_1 = require("../../../domain/repositories/ICustomerRepository");
const IInvoiceRepository_1 = require("../../../domain/repositories/IInvoiceRepository");
const AppError_1 = require("../../errors/AppError");
const date_fns_1 = require("date-fns");
let ProcessInvoiceUploadUseCase = class ProcessInvoiceUploadUseCase {
    constructor(customerRepository, invoiceRepository) {
        Object.defineProperty(this, "customerRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: customerRepository
        });
        Object.defineProperty(this, "invoiceRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: invoiceRepository
        });
        Object.defineProperty(this, "createdCustomersCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "createdInvoicesCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "updatedInvoicesCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "skippedRowsCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "rowErrors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "currentUserId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        }); // Поле для хранения userId
    }
    // --- ИЗМЕНЕНИЕ: Добавляем userId в execute ---
    async execute(filePath, userId) {
        this.resetState();
        this.currentUserId = userId; // <-- Сохраняем ID пользователя
        let totalRows = 0;
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
        try {
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            const parseResult = await this.parseCsv(fileContent);
            parseResult.errors.forEach((err) => this.rowErrors.push(`Ошибка парсинга CSV: ${err.message || 'Неизвестная ошибка'} (строка ${err.row})`));
            const rowsToProcess = parseResult.data;
            totalRows = rowsToProcess.length;
            let currentRowIndex = parseResult.meta.fields ? 2 : 1;
            for (const row of rowsToProcess) {
                try {
                    // --- ИЗМЕНЕНИЕ: userId уже есть в this.currentUserId, processRow его использует ---
                    await this.processRow(row, currentRowIndex);
                    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
                }
                catch (error) {
                    let errorMessage = 'Неизвестная ошибка обработки';
                    // ... (обработка ошибок строки без изменений) ...
                    if (error instanceof Error)
                        errorMessage = error.message;
                    else if (typeof error === 'string')
                        errorMessage = error;
                    console.error(`Error processing row ${currentRowIndex}:`, error);
                    this.skippedRowsCount++;
                    this.rowErrors.push(`Строка ${currentRowIndex}: ${errorMessage}`);
                }
                currentRowIndex++;
            }
            return this.getFinalResult(totalRows);
        }
        catch (error) {
            // ... (общая обработка ошибок без изменений) ...
            let errorMessage = 'Неизвестная ошибка обработки файла';
            if (error instanceof Error)
                errorMessage = error.message;
            else if (typeof error === 'string')
                errorMessage = error;
            console.error('Error processing upload file:', error);
            throw new AppError_1.AppError(`Ошибка обработки файла: ${errorMessage}`, 500);
        }
        finally {
            this.currentUserId = null; // <-- Очищаем userId
            this.tryDeleteFile(filePath);
        }
    }
    resetState() {
        /* ... без изменений ... */
        this.createdCustomersCount = 0;
        this.createdInvoicesCount = 0;
        this.updatedInvoicesCount = 0;
        this.skippedRowsCount = 0;
        this.rowErrors = [];
    }
    getFinalResult(totalRows) {
        /* ... без изменений ... */
        return {
            totalRows: totalRows,
            processedRows: totalRows - this.skippedRowsCount,
            createdCustomers: this.createdCustomersCount,
            createdInvoices: this.createdInvoicesCount,
            updatedInvoices: this.updatedInvoicesCount,
            skippedRows: this.skippedRowsCount,
            errors: this.rowErrors,
        };
    }
    parseCsv(fileContent) {
        /* ... без изменений ... */
        return new Promise((resolve, reject) => {
            papaparse_1.default.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (results) => {
                    const requiredHeaders = [
                        'InvoiceNumber',
                        'CustomerName',
                        'CustomerINN',
                        'IssueDate',
                        'DueDate',
                        'TotalAmount',
                    ];
                    const actualHeaders = results.meta.fields;
                    if (!actualHeaders ||
                        !requiredHeaders.every((h) => actualHeaders.includes(h))) {
                        return reject(new Error(`Отсутствуют необходимые заголовки в CSV. Ожидались: ${requiredHeaders.join(', ')}`));
                    }
                    results.data = results.data.filter((row) => Object.values(row).some((val) => val != null && String(val).trim() !== ''));
                    resolve(results);
                },
                error: (error) => {
                    reject(new Error(`Ошибка парсинга CSV: ${error.message}`));
                },
            });
        });
    }
    async processRow(row, rowIndex) {
        const validatedData = this.validateAndTransformRow(row, rowIndex);
        // --- ИЗМЕНЕНИЕ: findOrCreateCustomer теперь использует this.currentUserId ---
        const customer = await this.findOrCreateCustomer(validatedData.customerInn, validatedData.customerName, rowIndex);
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
        if (!customer) {
            // Добавим проверку на всякий случай
            throw new Error(`Не удалось получить клиента для строки ${rowIndex}`);
        }
        const existingInvoice = await this.invoiceRepository.findByInvoiceNumberAndCustomerId(validatedData.invoiceNumber, customer.id);
        if (existingInvoice) {
            throw new Error(`Счет с номером ${validatedData.invoiceNumber} для клиента ${customer.name} (ID: ${customer.id}) уже существует.`);
        }
        const newInvoiceData = {
            invoiceNumber: validatedData.invoiceNumber,
            customerId: customer.id,
            issueDate: validatedData.issueDate,
            dueDate: validatedData.dueDate,
            totalAmount: validatedData.totalAmount,
            paidAmount: validatedData.paidAmount,
            status: 'OPEN',
        };
        await this.invoiceRepository.create(newInvoiceData);
        this.createdInvoicesCount++;
    }
    validateAndTransformRow(row, _rowIndex) {
        /* ... без изменений ... */
        const errors = [];
        const invoiceNumber = row.InvoiceNumber?.trim();
        const customerName = row.CustomerName?.trim();
        const customerInn = row.CustomerINN?.trim();
        const issueDateStr = row.IssueDate?.trim();
        const dueDateStr = row.DueDate?.trim();
        const totalAmountStr = row.TotalAmount?.trim();
        const paidAmountStr = row.PaidAmount?.trim();
        if (!invoiceNumber)
            errors.push('Отсутствует номер счета (InvoiceNumber)');
        if (!customerName)
            errors.push('Отсутствует имя клиента (CustomerName)');
        if (!customerInn)
            errors.push('Отсутствует ИНН клиента (CustomerINN)');
        if (!issueDateStr)
            errors.push('Отсутствует дата выставления (IssueDate)');
        if (!dueDateStr)
            errors.push('Отсутствует дата оплаты (DueDate)');
        if (!totalAmountStr)
            errors.push('Отсутствует сумма счета (TotalAmount)');
        const totalAmount = parseFloat(totalAmountStr?.replace(',', '.') || '');
        if (isNaN(totalAmount) || totalAmount <= 0)
            errors.push('Некорректная сумма счета (TotalAmount)');
        const paidAmount = parseFloat(paidAmountStr?.replace(',', '.') || '0');
        if (isNaN(paidAmount) || paidAmount < 0)
            errors.push('Некорректная оплаченная сумма (PaidAmount)');
        const issueDate = this.parseDate(issueDateStr);
        if (!issueDate)
            errors.push('Некорректный формат даты выставления (IssueDate)');
        const dueDate = this.parseDate(dueDateStr);
        if (!dueDate)
            errors.push('Некорректный формат даты оплаты (DueDate)');
        if (issueDate && dueDate && dueDate < issueDate)
            errors.push('Дата оплаты (DueDate) не может быть раньше даты выставления (IssueDate)');
        if (errors.length > 0) {
            throw new Error(`Ошибки валидации: ${errors.join('; ')}`);
        }
        return {
            invoiceNumber: invoiceNumber,
            customerName: customerName,
            customerInn: customerInn,
            issueDate: issueDate,
            dueDate: dueDate,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
        };
    }
    parseDate(dateString) {
        /* ... без изменений ... */
        if (!dateString)
            return null;
        const trimmedDate = dateString.trim();
        const formatsToTry = [
            (d) => (0, date_fns_1.parseISO)(d),
            (d) => (0, date_fns_1.parse)(d, 'yyyy-MM-dd', new Date()),
            (d) => (0, date_fns_1.parse)(d, 'dd.MM.yyyy', new Date()),
            (d) => (0, date_fns_1.parse)(d, 'MM/dd/yyyy', new Date()),
        ];
        for (const parser of formatsToTry) {
            try {
                const parsed = parser(trimmedDate);
                if ((0, date_fns_1.isValid)(parsed))
                    return parsed;
            }
            catch (e) { }
        }
        return null;
    }
    // --- ИЗМЕНЕНИЕ: Используем this.currentUserId при поиске и создании ---
    async findOrCreateCustomer(inn, name, rowIndex) {
        // Возвращаем null если userId не установлен
        if (!this.currentUserId) {
            console.error(`[findOrCreateCustomer] Critical Error: User ID (currentUserId) is null for row ${rowIndex}. Cannot proceed.`);
            // Выбрасываем ошибку, так как без userId создать клиента нельзя
            throw new Error(`Внутренняя ошибка: не удалось определить пользователя для создания клиента в строке ${rowIndex}.`);
        }
        try {
            // Ищем клиента по ИНН и ID пользователя
            let customer = await this.customerRepository.findByInn(inn);
            if (customer) {
                if (customer.name !== name) {
                    console.warn(`Row ${rowIndex}: Customer INN ${inn} (user ${this.currentUserId}) found, but name differs (DB: '${customer.name}', CSV: '${name}'). Using existing.`);
                }
                return customer;
            }
            else {
                // Создаем нового клиента, передавая все необходимые данные
                const newCustomer = await this.customerRepository.create({
                    name: name,
                    inn: inn,
                    userId: this.currentUserId, // Передаем ID текущего пользователя
                });
                this.createdCustomersCount++;
                console.log(`Row ${rowIndex}: Created new customer '${name}' (INN: ${inn}) for user ${this.currentUserId} (ID: ${newCustomer.id})`);
                return newCustomer;
            }
        }
        catch (error) {
            console.error(`Row ${rowIndex}: Error finding or creating customer INN ${inn} for user ${this.currentUserId}`, error);
            // Попытка повторного поиска на случай гонки
            let retryCustomer = null;
            try {
                retryCustomer = await this.customerRepository.findByInn(inn);
            }
            catch (retryError) {
                /* Игнорируем ошибку повторного поиска */
            }
            if (retryCustomer) {
                console.warn(`Row ${rowIndex}: Found customer INN ${inn} (user ${this.currentUserId}) on retry after creation/find error.`);
                return retryCustomer;
            }
            // Если не удалось ни найти, ни создать, ни найти повторно - выбрасываем ошибку
            throw new Error(`Не удалось найти или создать клиента с ИНН ${inn} для пользователя ${this.currentUserId}. Причина: ${error.message || error}`);
        }
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    tryDeleteFile(filePath) {
        /* ... без изменений ... */
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`Temporary file deleted: ${filePath}`);
            }
        }
        catch (unlinkError) {
            let errorMessage = 'Неизвестная ошибка при удалении файла';
            if (unlinkError instanceof Error)
                errorMessage = unlinkError.message;
            else if (typeof unlinkError === 'string')
                errorMessage = unlinkError;
            console.error(`Error deleting temporary file ${filePath}: ${errorMessage}`, unlinkError);
        }
    }
};
exports.ProcessInvoiceUploadUseCase = ProcessInvoiceUploadUseCase;
exports.ProcessInvoiceUploadUseCase = ProcessInvoiceUploadUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(ICustomerRepository_1.CustomerRepositoryToken)),
    __param(1, (0, tsyringe_1.inject)(IInvoiceRepository_1.InvoiceRepositoryToken)),
    __metadata("design:paramtypes", [Object, Object])
], ProcessInvoiceUploadUseCase);
//# sourceMappingURL=process-invoice-upload.use-case.js.map