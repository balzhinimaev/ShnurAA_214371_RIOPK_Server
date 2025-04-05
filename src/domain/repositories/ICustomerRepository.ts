// src/domain/repositories/ICustomerRepository.ts
import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
    findById(id: string): Promise<Customer | null>;
    // findByName(name: string): Promise<Customer | null>;
    // findAll(options?: { page: number, limit: number, search?: string }): Promise<{ items: Customer[]; total: number }>;
    // create(data: CreateCustomerProps): Promise<Customer>;
}
export const CustomerRepositoryToken = Symbol('ICustomerRepository');
