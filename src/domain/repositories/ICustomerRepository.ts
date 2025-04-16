// src/domain/repositories/ICustomerRepository.ts
import { Customer } from '../entities/customer.entity';

// --- ТИПЫ ДАННЫХ ---
// Для создания клиента (уже есть у вас)
export interface CreateCustomerData {
    // Делаем export, чтобы можно было использовать в других местах
    name: string;
    inn?: string;
    contactInfo?: string;
    userId: string;
}

// Для опций поиска/пагинации
export interface FindAllCustomersOptions {
    userId: string; // Клиенты ищутся в рамках пользователя
    limit?: number;
    offset?: number;
    sortBy?: keyof Customer | string; // Поля Customer или кастомные
    sortOrder?: 'asc' | 'desc';
    // filter?: { name?: string; inn?: string }; // Опционально
}

// Для обновления клиента
export interface UpdateCustomerData {
    name?: string;
    contactInfo?: string | null;
    // INN и userId не меняем через этот метод
}
// --- КОНЕЦ ТИПОВ ДАННЫХ ---

// --- ОСНОВНОЙ ИНТЕРФЕЙС РЕПОЗИТОРИЯ ---
export interface ICustomerRepository {
    // Существующие методы
    findById(id: string): Promise<Customer | null>;
    findByInn(inn: string, userId: string): Promise<Customer | null>;
    create(data: CreateCustomerData): Promise<Customer>;

    // --- ДОБАВЛЕННЫЕ МЕТОДЫ ---
    findAll(
        options: FindAllCustomersOptions,
    ): Promise<{ customers: Customer[]; total: number }>;
    update(
        id: string,
        userId: string,
        data: UpdateCustomerData,
    ): Promise<Customer | null>;
    delete(id: string, userId: string): Promise<boolean>;
    // --- КОНЕЦ ДОБАВЛЕННЫХ МЕТОДОВ ---
}
// --- КОНЕЦ ИНТЕРФЕЙСА ---

export const CustomerRepositoryToken = Symbol('ICustomerRepository');
