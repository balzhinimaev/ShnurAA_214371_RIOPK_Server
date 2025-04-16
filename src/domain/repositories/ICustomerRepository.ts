// src/domain/repositories/ICustomerRepository.ts
import { Customer } from '../entities/customer.entity';
interface CreateCustomerData {
    name: string;
    inn?: string;
    contactInfo?: string;
    userId: string; // <-- Обязательный userId
}

export interface ICustomerRepository {
    findById(id: string): Promise<Customer | null>;
    findByInn(inn: string, userId: string): Promise<Customer | null>; // <-- Добавлен userId
    create(data: CreateCustomerData): Promise<Customer>; // <-- Обновлен тип данных
    // findByName(name: string): Promise<Customer | null>;
    // findAll(options?: { page: number, limit: number, search?: string }): Promise<{ items: Customer[]; total: number }>;
    // create(data: CreateCustomerProps): Promise<Customer>;
}
export const CustomerRepositoryToken = Symbol('ICustomerRepository');
