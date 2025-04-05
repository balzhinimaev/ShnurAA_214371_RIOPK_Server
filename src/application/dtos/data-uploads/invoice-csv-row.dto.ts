// src/application/dtos/data-uploads/invoice-csv-row.dto.ts
import Papa from 'papaparse'; // Импортируем типы PapaParse

// Интерфейс для строки данных
export interface InvoiceCsvRowDto {
    InvoiceNumber: string; // Название должно совпадать с заголовком в CSV
    CustomerName: string;
    CustomerINN: string;
    IssueDate: string;
    DueDate: string;
    TotalAmount: string;
    PaidAmount?: string; // Опционально
}

// Тип для результата парсинга
export type ParsedInvoicesResult = {
    data: InvoiceCsvRowDto[];
    errors: Papa.ParseError[];
    meta: Papa.ParseMeta;
};
