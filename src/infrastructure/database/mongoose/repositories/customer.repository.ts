// src/infrastructure/database/mongoose/repositories/customer.repository.ts
import { injectable } from 'tsyringe';
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerModel, ICustomerDocument } from '../schemas/customer.schema';
import {
    ICustomerRepository,
    CreateCustomerData,
    FindAllCustomersOptions,
    UpdateCustomerData,
} from '../../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../../../application/errors/AppError';
import mongoose, { Types } from 'mongoose';

@injectable()
export class MongoCustomerRepository implements ICustomerRepository {
    private mapToDomain(doc: ICustomerDocument | null): Customer | null {
        if (!doc) return null;
        // Используем toObject, так как lean() убран из findAll
        const obj = doc.toObject();
        return new Customer({
            id: obj.id, // Предполагается, что transform в схеме добавляет id
            name: obj.name,
            inn: obj.inn,
            contactInfo: obj.contactInfo,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
        });
    }

    async findById(id: string): Promise<Customer | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        try {
            const doc = await CustomerModel.findById(id).exec();
            return this.mapToDomain(doc);
        } catch (error) {
            console.error(`Error finding customer by ID ${id}:`, error);
            throw new AppError('Ошибка при поиске клиента по ID', 500);
        }
    }

    async findByInn(inn: string, userId: string): Promise<Customer | null> {
        if (!inn || !mongoose.Types.ObjectId.isValid(userId)) {
            return null;
        }
        try {
            const userObjectId = new Types.ObjectId(userId);
            const doc = await CustomerModel.findOne({
                userId: userObjectId,
                inn: inn,
            }).exec();
            return this.mapToDomain(doc);
        } catch (error) {
            console.error(
                `Error finding customer by INN ${inn} for user ${userId}:`,
                error,
            );
            throw new AppError('Ошибка при поиске клиента по ИНН', 500);
        }
    }

    async create(data: CreateCustomerData): Promise<Customer> {
        if (data.inn) {
            const existingByInn = await this.findByInn(data.inn, data.userId);
            if (existingByInn) {
                return existingByInn;
            }
        }
        try {
            const newCustomerDoc = new CustomerModel({
                name: data.name,
                inn: data.inn,
                contactInfo: data.contactInfo,
                userId: new Types.ObjectId(data.userId),
            });
            const savedDoc = await newCustomerDoc.save();
            const mappedCustomer = this.mapToDomain(savedDoc);
            if (!mappedCustomer) {
                throw new AppError(
                    'Не удалось смаппить клиента после создания',
                    500,
                );
            }
            return mappedCustomer;
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern?.inn) {
                if (data.inn) {
                    const existing = await this.findByInn(
                        data.inn,
                        data.userId,
                    );
                    if (existing) return existing;
                }
                throw new AppError(
                    `Клиент с ИНН ${data.inn} для пользователя ${data.userId} уже существует.`,
                    409,
                );
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(
                    `Ошибка валидации при создании клиента: ${messages}`,
                    400,
                );
            }
            console.error(
                `Error creating customer ${data.name} (INN: ${data.inn}) for user ${data.userId}:`,
                error,
            );
            throw new AppError('Ошибка при создании клиента', 500);
        }
    }

    async findAll(
        options: FindAllCustomersOptions,
    ): Promise<{ customers: Customer[]; total: number }> {
        if (!mongoose.Types.ObjectId.isValid(options.userId)) {
            throw new AppError(
                'Неверный формат ID пользователя для поиска клиентов',
                400,
            );
        }

        const {
            userId,
            limit = 10,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const userObjectId = new Types.ObjectId(userId);
        const filterQuery: mongoose.FilterQuery<ICustomerDocument> = {
            userId: userObjectId,
        };

        const sortQuery: { [key: string]: 1 | -1 } = {};
        sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

        try {
            const [customerDocs, total] = await Promise.all([
                CustomerModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    // .lean() // <-- УБРАЛИ lean()
                    .exec(),
                CustomerModel.countDocuments(filterQuery),
            ]);

            const customers = customerDocs
                .map((doc) => this.mapToDomain(doc)) // mapToDomain теперь получит Mongoose документы
                .filter((customer): customer is Customer => customer !== null);

            return { customers, total };
        } catch (dbError: any) {
            console.error(
                `Error in findAll customers for user ${userId}:`,
                dbError,
            );
            throw new AppError(
                'Ошибка базы данных при получении списка клиентов',
                500,
                false,
            );
        }
    }

    async update(
        id: string,
        userId: string,
        data: UpdateCustomerData,
    ): Promise<Customer | null> {
        if (
            !mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return null;
        }

        const userObjectId = new Types.ObjectId(userId);
       const updateData: Partial<ICustomerDocument> = {};
       if (data.name !== undefined) {
           updateData.name = data.name;
       }
       // Преобразуем null в undefined для contactInfo
       if (data.contactInfo !== undefined) {
           // Сначала проверяем, что поле вообще пришло
           updateData.contactInfo =
               data.contactInfo === null ? undefined : data.contactInfo;
       }
       
        if (Object.keys(updateData).length === 0) {
            try {
                const currentCustomerDoc = await CustomerModel.findOne({
                    _id: id,
                    userId: userObjectId,
                }).exec();
                return this.mapToDomain(currentCustomerDoc);
            } catch (findError) {
                console.error(
                    `Error finding customer ${id} for user ${userId} during no-op update:`,
                    findError,
                );
                throw new AppError(
                    'Ошибка при поиске клиента для обновления',
                    500,
                );
            }
        }

        try {
            const updatedCustomerDoc = await CustomerModel.findOneAndUpdate(
                { _id: id, userId: userObjectId },
                { $set: updateData },
                { new: true, runValidators: true },
            ).exec(); // Убрали lean, чтобы mapToDomain получил документ

            return this.mapToDomain(updatedCustomerDoc);
        } catch (dbError: any) {
            console.error(
                `Error updating customer ${id} for user ${userId}:`,
                dbError,
            );
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(
                    `Ошибка валидации при обновлении клиента: ${messages}`,
                    400,
                );
            }
            throw new AppError(
                'Ошибка базы данных при обновлении клиента',
                500,
                false,
            );
        }
    }

    async delete(id: string, userId: string): Promise<boolean> {
        if (
            !mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return false;
        }
        const userObjectId = new Types.ObjectId(userId);
        try {
            const result = await CustomerModel.deleteOne({
                _id: id,
                userId: userObjectId,
            }).exec();
            return result.deletedCount > 0;
        } catch (dbError: any) {
            console.error(
                `Error deleting customer ${id} for user ${userId}:`,
                dbError,
            );
            throw new AppError(
                'Ошибка базы данных при удалении клиента',
                500,
                false,
            );
        }
    }
}
