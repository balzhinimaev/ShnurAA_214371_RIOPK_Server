// src/domain/repositories/ICustomerRepository.ts
import { Customer } from '../entities/customer.entity';

// Тип для создания остается прежним (userId нужен для аудита)
export interface CreateCustomerData {
    name: string;
    unp?: string;
    contactInfo?: string;
    userId: string; // Кто создал
}

// --- ИЗМЕНЕНО: Убран userId из опций поиска ---
export interface FindAllCustomersOptions {
    // userId: string; // БОЛЬШЕ НЕ НУЖЕН ДЛЯ ФИЛЬТРАЦИИ
    limit?: number;
    offset?: number;
    sortBy?: keyof Customer | string;
    sortOrder?: 'asc' | 'desc';
    // Фильтры для поиска
    name?: string; // Поиск по названию (регистронезависимый)
    unp?: string; // Поиск по УНП (точное совпадение или частичное)
    contactInfo?: string; // Поиск по контактной информации (регистронезависимый)
}

// Тип для обновления остается прежним
export interface UpdateCustomerData {
    name?: string;
    contactInfo?: string | null;
}

export interface ICustomerRepository {
    findById(id: string): Promise<Customer | null>;

    // --- ИЗМЕНЕНО: Убран userId ---
    findByUnp(unp: string): Promise<Customer | null>; // УНП считаем глобально уникальным

    create(data: CreateCustomerData): Promise<Customer>;

    // --- ИЗМЕНЕНО: Сигнатура findAll ---
    findAll(
        options: FindAllCustomersOptions, // Больше не требует userId
    ): Promise<{ customers: Customer[]; total: number }>;

    // --- ИЗМЕНЕНО: Сигнатура update (убран userId) ---
    update(id: string, data: UpdateCustomerData): Promise<Customer | null>;

    // --- ИЗМЕНЕНО: Сигнатура delete (убран userId) ---
    delete(id: string): Promise<boolean>;
}

export const CustomerRepositoryToken = Symbol('ICustomerRepository');
