// src/application/use-cases/data-uploads/process-invoice-upload.use-case.ts
import { injectable, inject } from 'tsyringe';
import fs from 'fs';
import Papa from 'papaparse';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    // CreateCustomerProps // <-- Используем новый тип из репозитория или определяем здесь
} from '../../../domain/repositories/ICustomerRepository';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import { Customer } from '../../../domain/entities/customer.entity';
import {
    Invoice,
    InvoiceStatus,
} from '../../../domain/entities/invoice.entity';
import { AppError } from '../../errors/AppError';
import { InvoiceCsvRowDto } from '../../dtos/data-uploads/invoice-csv-row.dto';
import { isValid, parse, parseISO } from 'date-fns';

// Интерфейс для результата (без изменений)
export interface ProcessUploadResult {
    totalRows: number;
    processedRows: number;
    createdCustomers: number;
    createdInvoices: number;
    updatedInvoices: number;
    skippedRows: number;
    errors: string[];
}

// Используем тип данных для создания клиента из репозитория
// (Предполагается, что CreateCustomerData экспортирован из customer.repository или ICustomerRepository)
// // ИЛИ определите его здесь, если он не экспортирован
// interface CreateCustomerData {
//     name: string;
//     inn?: string;
//     contactInfo?: string;
//     userId: string;
// }

// Интерфейсы репозиториев с нужными методами
// interface ICustomerRepositoryExtended extends ICustomerRepository {
//     // findByInn(inn: string): Promise<Customer | null>; // Используем сигнатуру из ICustomerRepository
//     // create(data: { name: string; inn?: string; contactInfo?: string; }): Promise<Customer>; // Используем сигнатуру из ICustomerRepository
// }
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

@injectable()
export class ProcessInvoiceUploadUseCase {
    private createdCustomersCount = 0;
    private createdInvoicesCount = 0;
    private updatedInvoicesCount = 0;
    private skippedRowsCount = 0;
    private rowErrors: string[] = [];
    private currentUserId: string | null = null; // Поле для хранения userId

    constructor(
        // --- ИЗМЕНЕНИЕ: Используем базовый интерфейс, репозиторий сам реализует нужные методы ---
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended, // Оставляем расширенный для create/findBy...
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    ) {}

    // --- ИЗМЕНЕНИЕ: Добавляем userId в execute ---
    async execute(
        filePath: string,
        userId: string,
    ): Promise<ProcessUploadResult> {
        this.resetState();
        this.currentUserId = userId; // <-- Сохраняем ID пользователя
        let totalRows = 0;
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parseResult = await this.parseCsv(fileContent);

            parseResult.errors.forEach((err) =>
                this.rowErrors.push(
                    `Ошибка парсинга CSV: ${err.message || 'Неизвестная ошибка'} (строка ${err.row})`,
                ),
            );

            const rowsToProcess = parseResult.data;
            totalRows = rowsToProcess.length;
            let currentRowIndex = parseResult.meta.fields ? 2 : 1;

            for (const row of rowsToProcess) {
                try {
                    // --- ИЗМЕНЕНИЕ: userId уже есть в this.currentUserId, processRow его использует ---
                    await this.processRow(row, currentRowIndex);
                    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
                } catch (error: unknown) {
                    let errorMessage = 'Неизвестная ошибка обработки';
                    // ... (обработка ошибок строки без изменений) ...
                    if (error instanceof Error) errorMessage = error.message;
                    else if (typeof error === 'string') errorMessage = error;
                    console.error(
                        `Error processing row ${currentRowIndex}:`,
                        error,
                    );
                    this.skippedRowsCount++;
                    this.rowErrors.push(
                        `Строка ${currentRowIndex}: ${errorMessage}`,
                    );
                }
                currentRowIndex++;
            }

            return this.getFinalResult(totalRows);
        } catch (error: unknown) {
            // ... (общая обработка ошибок без изменений) ...
            let errorMessage = 'Неизвестная ошибка обработки файла';
            if (error instanceof Error) errorMessage = error.message;
            else if (typeof error === 'string') errorMessage = error;
            console.error('Error processing upload file:', error);
            throw new AppError(`Ошибка обработки файла: ${errorMessage}`, 500);
        } finally {
            this.currentUserId = null; // <-- Очищаем userId
            this.tryDeleteFile(filePath);
        }
    }

    private resetState(): void {
        /* ... без изменений ... */
        this.createdCustomersCount = 0;
        this.createdInvoicesCount = 0;
        this.updatedInvoicesCount = 0;
        this.skippedRowsCount = 0;
        this.rowErrors = [];
    }
    private getFinalResult(totalRows: number): ProcessUploadResult {
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
    private parseCsv(
        fileContent: string,
    ): Promise<Papa.ParseResult<InvoiceCsvRowDto>> {
        /* ... без изменений ... */
        return new Promise((resolve, reject) => {
            Papa.parse<InvoiceCsvRowDto>(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (results: Papa.ParseResult<InvoiceCsvRowDto>) => {
                    const requiredHeaders = [
                        'InvoiceNumber',
                        'CustomerName',
                        'CustomerINN',
                        'IssueDate',
                        'DueDate',
                        'TotalAmount',
                    ];
                    const actualHeaders = results.meta.fields;
                    if (
                        !actualHeaders ||
                        !requiredHeaders.every((h) => actualHeaders.includes(h))
                    ) {
                        return reject(
                            new Error(
                                `Отсутствуют необходимые заголовки в CSV. Ожидались: ${requiredHeaders.join(', ')}`,
                            ),
                        );
                    }
                    results.data = results.data.filter((row) =>
                        Object.values(row).some(
                            (val) => val != null && String(val).trim() !== '',
                        ),
                    );
                    resolve(results);
                },
                error: (error: Error) => {
                    reject(new Error(`Ошибка парсинга CSV: ${error.message}`));
                },
            });
        });
    }

    private async processRow(
        row: InvoiceCsvRowDto,
        rowIndex: number,
    ): Promise<void> {
        const validatedData = this.validateAndTransformRow(row, rowIndex);

        // --- ИЗМЕНЕНИЕ: findOrCreateCustomer теперь использует this.currentUserId ---
        const customer = await this.findOrCreateCustomer(
            validatedData.customerInn,
            validatedData.customerName,
            rowIndex,
        );
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        if (!customer) {
            // Добавим проверку на всякий случай
            throw new Error(
                `Не удалось получить клиента для строки ${rowIndex}`,
            );
        }

        const existingInvoice =
            await this.invoiceRepository.findByInvoiceNumberAndCustomerId(
                validatedData.invoiceNumber,
                customer.id,
            );
        if (existingInvoice) {
            throw new Error(
                `Счет с номером ${validatedData.invoiceNumber} для клиента ${customer.name} (ID: ${customer.id}) уже существует.`,
            );
        }

        const newInvoiceData = {
            invoiceNumber: validatedData.invoiceNumber,
            customerId: customer.id,
            issueDate: validatedData.issueDate,
            dueDate: validatedData.dueDate,
            totalAmount: validatedData.totalAmount,
            paidAmount: validatedData.paidAmount,
            status: 'OPEN' as InvoiceStatus,
        };

        await this.invoiceRepository.create(newInvoiceData);
        this.createdInvoicesCount++;
    }

    private validateAndTransformRow(row: InvoiceCsvRowDto, _rowIndex: number) {
        /* ... без изменений ... */
        const errors: string[] = [];
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
        if (!customerInn) errors.push('Отсутствует ИНН клиента (CustomerINN)');
        if (!issueDateStr)
            errors.push('Отсутствует дата выставления (IssueDate)');
        if (!dueDateStr) errors.push('Отсутствует дата оплаты (DueDate)');
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
        if (!dueDate) errors.push('Некорректный формат даты оплаты (DueDate)');

        if (issueDate && dueDate && dueDate < issueDate)
            errors.push(
                'Дата оплаты (DueDate) не может быть раньше даты выставления (IssueDate)',
            );

        if (errors.length > 0) {
            throw new Error(`Ошибки валидации: ${errors.join('; ')}`);
        }

        return {
            invoiceNumber: invoiceNumber!,
            customerName: customerName!,
            customerInn: customerInn!,
            issueDate: issueDate!,
            dueDate: dueDate!,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
        };
    }

    private parseDate(dateString: string | undefined | null): Date | null {
        /* ... без изменений ... */
        if (!dateString) return null;
        const trimmedDate = dateString.trim();
        const formatsToTry = [
            (d: string) => parseISO(d),
            (d: string) => parse(d, 'yyyy-MM-dd', new Date()),
            (d: string) => parse(d, 'dd.MM.yyyy', new Date()),
            (d: string) => parse(d, 'MM/dd/yyyy', new Date()),
        ];
        for (const parser of formatsToTry) {
            try {
                const parsed = parser(trimmedDate);
                if (isValid(parsed)) return parsed;
            } catch (e) {}
        }
        return null;
    }

    // --- ИЗМЕНЕНИЕ: Используем this.currentUserId при поиске и создании ---
    private async findOrCreateCustomer(
        inn: string,
        name: string,
        rowIndex: number,
    ): Promise<Customer | null> {
        // Возвращаем null если userId не установлен
        if (!this.currentUserId) {
            console.error(
                `[findOrCreateCustomer] Critical Error: User ID (currentUserId) is null for row ${rowIndex}. Cannot proceed.`,
            );
            // Выбрасываем ошибку, так как без userId создать клиента нельзя
            throw new Error(
                `Внутренняя ошибка: не удалось определить пользователя для создания клиента в строке ${rowIndex}.`,
            );
        }

        try {
            // Ищем клиента по ИНН и ID пользователя
            let customer = await this.customerRepository.findByInn(
                inn,
                this.currentUserId,
            );

            if (customer) {
                if (customer.name !== name) {
                    console.warn(
                        `Row ${rowIndex}: Customer INN ${inn} (user ${this.currentUserId}) found, but name differs (DB: '${customer.name}', CSV: '${name}'). Using existing.`,
                    );
                }
                return customer;
            } else {
                // Создаем нового клиента, передавая все необходимые данные
                const newCustomer = await this.customerRepository.create({
                    name: name,
                    inn: inn,
                    userId: this.currentUserId, // Передаем ID текущего пользователя
                });
                this.createdCustomersCount++;
                console.log(
                    `Row ${rowIndex}: Created new customer '${name}' (INN: ${inn}) for user ${this.currentUserId} (ID: ${newCustomer.id})`,
                );
                return newCustomer;
            }
        } catch (error: any) {
            console.error(
                `Row ${rowIndex}: Error finding or creating customer INN ${inn} for user ${this.currentUserId}`,
                error,
            );
            // Попытка повторного поиска на случай гонки
            let retryCustomer = null;
            try {
                retryCustomer = await this.customerRepository.findByInn(
                    inn,
                    this.currentUserId,
                );
            } catch (retryError) {
                /* Игнорируем ошибку повторного поиска */
            }

            if (retryCustomer) {
                console.warn(
                    `Row ${rowIndex}: Found customer INN ${inn} (user ${this.currentUserId}) on retry after creation/find error.`,
                );
                return retryCustomer;
            }

            // Если не удалось ни найти, ни создать, ни найти повторно - выбрасываем ошибку
            throw new Error(
                `Не удалось найти или создать клиента с ИНН ${inn} для пользователя ${this.currentUserId}. Причина: ${error.message || error}`,
            );
        }
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    private tryDeleteFile(filePath: string): void {
        /* ... без изменений ... */
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Temporary file deleted: ${filePath}`);
            }
        } catch (unlinkError: unknown) {
            let errorMessage = 'Неизвестная ошибка при удалении файла';
            if (unlinkError instanceof Error)
                errorMessage = unlinkError.message;
            else if (typeof unlinkError === 'string')
                errorMessage = unlinkError;
            console.error(
                `Error deleting temporary file ${filePath}: ${errorMessage}`,
                unlinkError,
            );
        }
    }
}
