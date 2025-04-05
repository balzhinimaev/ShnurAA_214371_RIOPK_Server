// src/infrastructure/database/mongoose/repositories/customer.repository.ts
import { injectable } from 'tsyringe';
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository';
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerModel, ICustomerDocument } from '../schemas/customer.schema';

@injectable()
export class MongoCustomerRepository implements ICustomerRepository {
    private mapToDomain(doc: ICustomerDocument): Customer {
        const obj = doc.toObject();
        return new Customer({
            id: obj.id,
            name: obj.name,
            inn: obj.inn,
            contactInfo: obj.contactInfo,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
            // totalDebt и overdueDebt здесь не мапятся
        });
    }

    async findById(id: string): Promise<Customer | null> {
        // Проверка на валидность ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        const doc = await CustomerModel.findById(id).exec();
        return doc ? this.mapToDomain(doc) : null;
    }
}
