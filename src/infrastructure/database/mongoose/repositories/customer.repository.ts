// src/infrastructure/database/mongoose/repositories/customer.repository.ts
import { injectable } from 'tsyringe';
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerModel, ICustomerDocument } from '../schemas/customer.schema';
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../../../application/errors/AppError'; // Для возможной ошибки дубликата

// Расширяем базовый интерфейс для ясности
interface ICustomerRepositoryExtended extends ICustomerRepository {
    findByInn(inn: string): Promise<Customer | null>;
    create(data: {
        name: string;
        inn?: string;
        contactInfo?: string;
    }): Promise<Customer>;
}

@injectable()
export class MongoCustomerRepository implements ICustomerRepositoryExtended {
    /**
     * Преобразует документ Mongoose в доменную сущность Customer.
     * @param doc - Документ Mongoose.
     * @returns Экземпляр Customer.
     */
    private mapToDomain(doc: ICustomerDocument): Customer {
        const obj = doc.toObject(); // Используем toObject с настроенным transform
        return new Customer({
            id: obj.id,
            name: obj.name,
            inn: obj.inn,
            contactInfo: obj.contactInfo,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
            // totalDebt и overdueDebt не хранятся в этой модели
        });
    }

    /**
     * Находит клиента по его ID.
     * @param id - ID клиента (строка ObjectId).
     * @returns Промис с найденным Customer или null.
     */
    async findById(id: string): Promise<Customer | null> {
        // Проверка на валидность ObjectId
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        try {
            const doc = await CustomerModel.findById(id).exec();
            return doc ? this.mapToDomain(doc) : null;
        } catch (error) {
            console.error(`Error finding customer by ID ${id}:`, error);
            // Можно выбросить AppError или вернуть null в зависимости от стратегии обработки ошибок
            throw new AppError('Ошибка при поиске клиента по ID', 500);
        }
    }

    /**
     * Находит клиента по его ИНН.
     * @param inn - ИНН клиента.
     * @returns Промис с найденным Customer или null.
     */
    async findByInn(inn: string): Promise<Customer | null> {
        if (!inn) {
            // Не ищем по пустому ИНН
            return null;
        }
        try {
            // ИНН должен быть уникальным (согласно схеме)
            const doc = await CustomerModel.findOne({ inn: inn }).exec();
            return doc ? this.mapToDomain(doc) : null;
        } catch (error) {
            console.error(`Error finding customer by INN ${inn}:`, error);
            throw new AppError('Ошибка при поиске клиента по ИНН', 500);
        }
    }

    /**
     * Создает нового клиента.
     * @param data - Данные для создания клиента (name обязательно, inn и contactInfo опционально).
     * @returns Промис с созданным Customer.
     * @throws {AppError} Если клиент с таким ИНН уже существует (если ИНН предоставлен).
     */
    async create(data: {
        name: string;
        inn?: string;
        contactInfo?: string;
    }): Promise<Customer> {
        // Дополнительная проверка на дубликат ИНН перед попыткой сохранения
        if (data.inn) {
            const existingByInn = await this.findByInn(data.inn);
            if (existingByInn) {
                // Возвращаем существующего или выбрасываем ошибку - зависит от логики use case
                // В контексте findOrCreateCustomer - возвращаем существующего
                console.warn(
                    `Attempted to create customer with existing INN: ${data.inn}. Returning existing.`,
                );
                return existingByInn;
                // Или выбрасываем ошибку:
                // throw new AppError(`Клиент с ИНН ${data.inn} уже существует.`, 409); // 409 Conflict
            }
        }

        try {
            const newCustomerDoc = new CustomerModel({
                name: data.name,
                inn: data.inn,
                contactInfo: data.contactInfo,
            });
            const savedDoc = await newCustomerDoc.save();
            return this.mapToDomain(savedDoc);
        } catch (error: any) {
            // Обработка ошибок MongoDB (например, нарушение уникальности индекса, если проверка выше не сработала из-за гонки)
            if (error.code === 11000 && error.keyPattern?.inn) {
                console.error(
                    `Concurrency error: Customer with INN ${data.inn} already created.`,
                );
                // Попробуем найти еще раз
                const existing = await this.findByInn(data.inn!);
                if (existing) return existing;
                throw new AppError(
                    `Клиент с ИНН ${data.inn} уже существует (concurrency).`,
                    409,
                );
            }
            console.error(
                `Error creating customer ${data.name} (INN: ${data.inn}):`,
                error,
            );
            throw new AppError('Ошибка при создании клиента', 500);
        }
    }
}
