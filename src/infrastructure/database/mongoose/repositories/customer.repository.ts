// src/infrastructure/database/mongoose/repositories/customer.repository.ts
import { injectable } from 'tsyringe';
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerModel, ICustomerDocument } from '../schemas/customer.schema';
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../../../application/errors/AppError'; // Для возможной ошибки дубликата
import mongoose, { Types } from 'mongoose';

interface CreateCustomerData {
    name: string;
    inn?: string;
    contactInfo?: string;
    userId: string; // <-- Обязательный userId
}

// Расширяем базовый интерфейс для ясности
interface ICustomerRepositoryExtended extends ICustomerRepository {
    findByInn(inn: string, userId: string): Promise<Customer | null>;
    create(data: CreateCustomerData): Promise<Customer>;
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
    async findByInn(inn: string, userId: string): Promise<Customer | null> {
        if (!inn || !mongoose.Types.ObjectId.isValid(userId)) {
            // Проверяем и userId
            return null;
        }
        try {
            const userObjectId = new Types.ObjectId(userId);
            // Ищем по userId и inn
            const doc = await CustomerModel.findOne({
                userId: userObjectId,
                inn: inn,
            }).exec();
            return doc ? this.mapToDomain(doc) : null;
        } catch (error) {
            console.error(
                `Error finding customer by INN ${inn} for user ${userId}:`,
                error,
            );
            throw new AppError('Ошибка при поиске клиента по ИНН', 500);
        }
    }

    /**
     * Создает нового клиента.
     * @param data - Данные для создания клиента (name обязательно, inn и contactInfo опционально).
     * @returns Промис с созданным Customer.
     * @throws {AppError} Если клиент с таким ИНН уже существует (если ИНН предоставлен).
     */
    async create(data: CreateCustomerData): Promise<Customer> {
        // Проверка на дубликат ИНН в рамках пользователя перед попыткой сохранения
        if (data.inn) {
            const existingByInn = await this.findByInn(data.inn, data.userId); // Передаем userId
            if (existingByInn) {
                console.warn(
                    `Attempted to create customer for user ${data.userId} with existing INN: ${data.inn}. Returning existing.`,
                );
                return existingByInn; // Возвращаем существующего, как и хотели
            }
        }

        try {
            const newCustomerDoc = new CustomerModel({
                name: data.name,
                inn: data.inn,
                contactInfo: data.contactInfo,
                userId: new Types.ObjectId(data.userId), // <-- Передаем и преобразуем userId
            });
            // Сохранение вызовет ошибку валидации, если userId отсутствует или некорректен
            const savedDoc = await newCustomerDoc.save();
            return this.mapToDomain(savedDoc);
        } catch (error: any) {
            // Обработка ошибок MongoDB
            if (error.code === 11000 && error.keyPattern?.inn) {
                // Попробуем найти еще раз на случай гонки
                if (data.inn) {
                    // Убедимся, что inn есть перед повторным поиском
                    const existing = await this.findByInn(
                        data.inn,
                        data.userId,
                    ); // Передаем userId
                    if (existing) return existing;
                }
                // Если все еще не нашли, выбрасываем ошибку
                throw new AppError(
                    `Клиент с ИНН ${data.inn} для пользователя ${data.userId} уже существует (concurrency).`,
                    409,
                );
            }
            // Обработка ошибок валидации Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                console.error(
                    `Validation error creating customer for user ${data.userId}: ${messages}`,
                    error.errors,
                );
                throw new AppError(
                    `Ошибка валидации при создании клиента: ${messages}`,
                    400,
                );
            }
            // Другие ошибки
            console.error(
                `Error creating customer ${data.name} (INN: ${data.inn}) for user ${data.userId}:`,
                error,
            );
            throw new AppError('Ошибка при создании клиента', 500);
        }
    }
}
