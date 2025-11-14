// src/application/use-cases/data-uploads/process-1c-invoice-upload.use-case.ts
import { injectable, inject } from 'tsyringe';
import fs from 'fs';
import Papa from 'papaparse';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';
import {
    Invoice,
    InvoiceStatus,
} from '../../../domain/entities/invoice.entity';
import { Customer } from '../../../domain/entities/customer.entity';
import { AppError } from '../../errors/AppError';
import { Invoice1cCsvRowDto } from '../../dtos/data-uploads/invoice-1c-row.dto';
import { ServiceTypeMapper } from './service-type.mapper';
import { isValid, parse, parseISO } from 'date-fns';

// Интерфейс для результата
export interface Process1cUploadResult {
    totalRows: number;
    processedRows: number;
    createdCustomers: number;
    createdInvoices: number;
    updatedInvoices: number;
    skippedRows: number;
    errors: string[];
}

// Расширенный интерфейс репозитория с дополнительными методами
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
            | 'getDaysOverdue'
            | 'calculateDebtWorkStatus'
            | 'applyPayment'
            | 'toJSON'
        >,
    ): Promise<Invoice>;
    findByInvoiceNumberAndCustomerId(
        invoiceNumber: string,
        customerId: string,
    ): Promise<Invoice | null>;
    updatePayment(
        id: string,
        paidAmount: number,
        actualPaymentDate?: Date,
    ): Promise<Invoice | null>;
}

@injectable()
export class Process1cInvoiceUploadUseCase {
    private createdCustomersCount = 0;
    private createdInvoicesCount = 0;
    private updatedInvoicesCount = 0;
    private skippedRowsCount = 0;
    private rowErrors: string[] = [];
    private currentUserId: string | null = null;

    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepositoryExtended,
    ) {}

    async execute(
        filePath: string,
        userId: string,
    ): Promise<Process1cUploadResult> {
        this.resetState();
        this.currentUserId = userId;
        let totalRows = 0;

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parseResult = await this.parseCsv(fileContent);

            // Фильтруем некритические предупреждения (например, "Too many fields")
            parseResult.errors.forEach((err) => {
                const errorMessage = err.message || 'Неизвестная ошибка';
                // Пропускаем предупреждения о количестве полей, если данные успешно распарсены
                if (errorMessage.includes('Too many fields') && parseResult.data.length > 0) {
                    console.warn(`CSV parsing warning (non-critical): ${errorMessage} (строка ${err.row})`);
                    return; // Не добавляем в критические ошибки
                }
                this.rowErrors.push(
                    `Ошибка парсинга CSV: ${errorMessage} (строка ${err.row})`,
                );
            });

            const rowsToProcess = parseResult.data;
            totalRows = rowsToProcess.length;
            let currentRowIndex = parseResult.meta.fields ? 2 : 1;

            for (const row of rowsToProcess) {
                try {
                    await this.processRow(row, currentRowIndex);
                } catch (error: unknown) {
                    let errorMessage = 'Неизвестная ошибка обработки';
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
            let errorMessage = 'Неизвестная ошибка обработки файла';
            if (error instanceof Error) errorMessage = error.message;
            else if (typeof error === 'string') errorMessage = error;
            
            console.error('Error processing upload file:', error);
            throw new AppError(`Ошибка обработки файла: ${errorMessage}`, 500);
        } finally {
            this.currentUserId = null;
            this.tryDeleteFile(filePath);
        }
    }

    private resetState(): void {
        this.createdCustomersCount = 0;
        this.createdInvoicesCount = 0;
        this.updatedInvoicesCount = 0;
        this.skippedRowsCount = 0;
        this.rowErrors = [];
    }

    private getFinalResult(totalRows: number): Process1cUploadResult {
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
    ): Promise<Papa.ParseResult<Invoice1cCsvRowDto>> {
        return new Promise((resolve, reject) => {
            Papa.parse<Invoice1cCsvRowDto>(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (results: Papa.ParseResult<Invoice1cCsvRowDto>) => {
                    const requiredHeaders = [
                        'Дата_начала_услуги',
                        'Дата_окончания_услуги',
                        'Номер_акта',
                        'Контрагент',
                        'ИНН',
                        'Сумма_к_оплате',
                        'Дата_планируемой_оплаты',
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
        row: Invoice1cCsvRowDto,
        rowIndex: number,
    ): Promise<void> {
        const validatedData = this.validateAndTransformRow(row, rowIndex);

        // Найти или создать клиента
        const customer = await this.findOrCreateCustomer(
            validatedData.unp,
            validatedData.customerName,
            rowIndex,
        );

        if (!customer) {
            throw new Error(
                `Не удалось получить клиента для строки ${rowIndex}`,
            );
        }

        // Проверить, существует ли уже такой счет
        const existingInvoice =
            await this.invoiceRepository.findByInvoiceNumberAndCustomerId(
                validatedData.invoiceNumber,
                customer.id,
            );

        if (existingInvoice) {
            // Обновляем существующий счет (если изменились суммы оплат)
            if (existingInvoice.paidAmount !== validatedData.paidAmount) {
                await this.invoiceRepository.updatePayment(
                    existingInvoice.id,
                    validatedData.paidAmount,
                    validatedData.actualPaymentDate ?? undefined,
                );
                this.updatedInvoicesCount++;
            } else {
                // Счет уже существует с теми же данными - пропускаем
                this.skippedRowsCount++;
                // Добавляем информативное сообщение о пропуске
                this.rowErrors.push(
                    `Строка ${rowIndex}: Счет "${validatedData.invoiceNumber}" для клиента "${validatedData.customerName}" уже существует с теми же данными (оплата не изменилась). Строка пропущена.`,
                );
            }
            return;
        }

        // Рассчитываем статус работы с долгом
        const currentDate = new Date();
        const tempInvoice = new Invoice({
            ...validatedData,
            id: 'temp',
            customerId: customer.id,
            actualPaymentDate: validatedData.actualPaymentDate ?? undefined,
            createdAt: currentDate,
            updatedAt: currentDate,
        });
        const debtWorkStatus = tempInvoice.calculateDebtWorkStatus(currentDate);

        // Создаем новый счет
        const newInvoiceData = {
            invoiceNumber: validatedData.invoiceNumber,
            customerId: customer.id,
            issueDate: validatedData.issueDate,
            dueDate: validatedData.dueDate,
            serviceStartDate: validatedData.serviceStartDate,
            serviceEndDate: validatedData.serviceEndDate,
            totalAmount: validatedData.totalAmount,
            paidAmount: validatedData.paidAmount,
            paymentTermDays: validatedData.paymentTermDays,
            actualPaymentDate: validatedData.actualPaymentDate ?? undefined,
            status: validatedData.status,
            debtWorkStatus: debtWorkStatus,
            serviceType: validatedData.serviceType,
            manager: validatedData.manager,
            contractNumber: validatedData.contractNumber,
            notes: validatedData.notes,
        };

        await this.invoiceRepository.create(newInvoiceData);
        this.createdInvoicesCount++;
    }

    private validateAndTransformRow(
        row: Invoice1cCsvRowDto,
        rowIndex: number,
    ) {
        const errors: string[] = [];

        // Извлекаем и валидируем базовые поля
        const invoiceNumber = row.Номер_акта?.trim();
        const customerName = row.Контрагент?.trim();
        const unp = row.ИНН?.trim();
        const serviceStartDateStr = row.Дата_начала_услуги?.trim();
        const serviceEndDateStr = row.Дата_окончания_услуги?.trim();
        const dueDateStr = row.Дата_планируемой_оплаты?.trim();
        const totalAmountStr = row.Сумма_к_оплате?.trim();
        const paidAmountStr = row.Сумма_оплачено?.trim();
        const paymentTermDaysStr = row.Срок_оплаты_дней?.trim();
        const actualPaymentDateStr = row.Дата_фактической_оплаты?.trim();
        const serviceTypeStr = row.Тип_услуги?.trim();
        const manager = row.Менеджер?.trim();
        const contractNumber = row.Договор?.trim(); // Номер договора
        const notes = row.Примечание?.trim();

        // Проверка обязательных полей
        if (!invoiceNumber) errors.push('Отсутствует номер акта');
        if (!customerName) errors.push('Отсутствует имя контрагента');
        if (!unp) errors.push('Отсутствует УНП');
        if (!serviceStartDateStr) errors.push('Отсутствует дата начала услуги');
        if (!serviceEndDateStr)
            errors.push('Отсутствует дата окончания услуги');
        if (!dueDateStr) errors.push('Отсутствует дата планируемой оплаты');
        if (!totalAmountStr) errors.push('Отсутствует сумма к оплате');

        // Парсинг и валидация сумм
        const totalAmount = parseFloat(totalAmountStr?.replace(',', '.') || '');
        if (isNaN(totalAmount) || totalAmount <= 0) {
            errors.push('Некорректная сумма к оплате');
        }

        const paidAmount = parseFloat(paidAmountStr?.replace(',', '.') || '0');
        if (isNaN(paidAmount) || paidAmount < 0) {
            errors.push('Некорректная оплаченная сумма');
        }

        const paymentTermDays = parseInt(paymentTermDaysStr || '30', 10);
        if (isNaN(paymentTermDays) || paymentTermDays < 0) {
            errors.push('Некорректный срок оплаты');
        }

        // Парсинг дат
        const serviceStartDate = this.parseDate(serviceStartDateStr);
        if (!serviceStartDate) {
            errors.push('Некорректная дата начала услуги');
        }

        const serviceEndDate = this.parseDate(serviceEndDateStr);
        if (!serviceEndDate) {
            errors.push('Некорректная дата окончания услуги');
        }

        let dueDate = this.parseDate(dueDateStr);
        if (!dueDate) {
            errors.push('Некорректная дата планируемой оплаты');
        }
        // АВТОСДВИГ ДАТ ОТКЛЮЧЕН ДЛЯ ДЕМОНСТРАЦИИ ЭВОЛЮЦИИ ДЗ
        // else {
        //     // Для демо-данных: если дата планируемой оплаты в прошлом, сдвигаем ее в будущее
        //     // чтобы счет не был просроченным для демонстрации
        //     const today = new Date();
        //     if (dueDate < today) {
        //         // Сдвигаем дату на год вперед, сохраняя месяц и день
        //         const futureDueDate = new Date(dueDate);
        //         futureDueDate.setFullYear(futureDueDate.getFullYear() + 1);
        //         // Если после сдвига дата все еще в прошлом (редкий случай), сдвигаем еще на год
        //         if (futureDueDate < today) {
        //             futureDueDate.setFullYear(futureDueDate.getFullYear() + 1);
        //         }
        //         dueDate = futureDueDate;
        //     }
        // }

        const actualPaymentDate = actualPaymentDateStr
            ? this.parseDate(actualPaymentDateStr) ?? undefined
            : undefined;

        // Issuedate = serviceEndDate (дата выставления счета = дата окончания услуги)
        const issueDate = serviceEndDate;

        // Определяем статус
        let status: InvoiceStatus = 'OPEN';
        if (paidAmount >= totalAmount) {
            status = 'PAID';
        } else if (dueDate && dueDate < new Date()) {
            status = 'OVERDUE';
        }

        // Маппинг типа услуги
        const serviceType = ServiceTypeMapper.map(serviceTypeStr);

        if (errors.length > 0) {
            throw new Error(
                `Ошибки валидации в строке ${rowIndex}: ${errors.join('; ')}`,
            );
        }

        return {
            invoiceNumber: invoiceNumber!,
            customerName: customerName!,
            unp: unp!,
            issueDate: issueDate!,
            dueDate: dueDate!,
            serviceStartDate: serviceStartDate!,
            serviceEndDate: serviceEndDate!,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            paymentTermDays: paymentTermDays,
            actualPaymentDate: actualPaymentDate,
            status: status,
            serviceType: serviceType,
            manager: manager,
            contractNumber: contractNumber,
            notes: notes,
        };
    }

    private parseDate(dateString: string | undefined | null): Date | null {
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
                if (isValid(parsed)) {
                    // Нормализуем дату для демо-данных
                    return this.normalizeDateForDemo(parsed);
                }
            } catch (e) {
                // Continue to next format
            }
        }
        return null;
    }

    /**
     * Нормализует даты из старых CSV для демонстрации.
     * Если дата старше 200 дней, переносит её на текущий год,
     * сохраняя месяц и день для правильной возрастной структуры.
     * Для дат планируемой оплаты гарантирует, что они будут в будущем.
     */
    private normalizeDateForDemo(date: Date): Date {
        const today = new Date();
        const diffDays = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

        // Если дата старше 200 дней — считаем это старыми демо-данными
        if (diffDays > 200) {
            const normalized = new Date(date);
            normalized.setFullYear(today.getFullYear());

            // Если после переноса дата в будущем, сдвигаем на год назад
            if (normalized > today) {
                normalized.setFullYear(today.getFullYear() - 1);
            }
            
            // Если дата все еще в прошлом (но не слишком далеко), сдвигаем вперед на год
            // чтобы она была в будущем для демо-данных
            if (normalized < today && diffDays < 400) {
                normalized.setFullYear(today.getFullYear() + 1);
            }

            return normalized;
        }

        return date;
    }

    private async findOrCreateCustomer(
        unp: string,
        name: string,
        rowIndex: number,
    ): Promise<Customer | null> {
        if (!this.currentUserId) {
            console.error(
                `[findOrCreateCustomer] Critical Error: User ID is null for row ${rowIndex}.`,
            );
            throw new Error(
                `Внутренняя ошибка: не удалось определить пользователя для создания клиента в строке ${rowIndex}.`,
            );
        }

        try {
            let customer = await this.customerRepository.findByUnp(unp);

            if (customer) {
                if (customer.name !== name) {
                    console.warn(
                        `Row ${rowIndex}: Customer УНП ${unp} found, but name differs (DB: '${customer.name}', CSV: '${name}'). Using existing.`,
                    );
                }
                return customer;
            } else {
                const newCustomer = await this.customerRepository.create({
                    name: name,
                    unp: unp,
                    userId: this.currentUserId,
                });
                this.createdCustomersCount++;
                console.log(
                    `Row ${rowIndex}: Created new customer '${name}' (УНП: ${unp}) (ID: ${newCustomer.id})`,
                );
                return newCustomer;
            }
        } catch (error: any) {
            console.error(
                `Row ${rowIndex}: Error finding or creating customer УНП ${unp}`,
                error,
            );

            // Попытка повторного поиска
            let retryCustomer = null;
            try {
                retryCustomer = await this.customerRepository.findByUnp(unp);
            } catch (retryError) {
                // Ignore
            }

            if (retryCustomer) {
                console.warn(
                    `Row ${rowIndex}: Found customer УНП ${unp} on retry.`,
                );
                return retryCustomer;
            }

            throw new Error(
                `Не удалось найти или создать клиента с УНП ${unp}. Причина: ${error.message || error}`,
            );
        }
    }

    private tryDeleteFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Temporary file deleted: ${filePath}`);
            }
        } catch (unlinkError: unknown) {
            let errorMessage = 'Неизвестная ошибка при удалении файла';
            if (unlinkError instanceof Error) {
                errorMessage = unlinkError.message;
            } else if (typeof unlinkError === 'string') {
                errorMessage = unlinkError;
            }
            console.error(
                `Error deleting temporary file ${filePath}: ${errorMessage}`,
                unlinkError,
            );
        }
    }
}

