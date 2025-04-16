// src/infrastructure/database/mongoose/repositories/customer.repository.ts
import { injectable } from 'tsyringe';
import mongoose, { FilterQuery } from 'mongoose'; // Добавлен FilterQuery
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerModel, ICustomerDocument } from '../schemas/customer.schema';
import {
    ICustomerRepository,
    CreateCustomerData,
    FindAllCustomersOptions,
    UpdateCustomerData,
} from '../../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../../../application/errors/AppError';

@injectable()
export class MongoCustomerRepository implements ICustomerRepository {
    // Хелпер маппинга: принимает простой объект (из .lean())
    private mapToDomain(doc: any | null): Customer | null {
        if (!doc) return null;
        return new Customer({
            // Используем _id, если transform в схеме не настроен/не используется
            id: doc._id.toString(),
            name: doc.name,
            inn: doc.inn,
            contactInfo: doc.contactInfo,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            // userId здесь не нужен для доменной логики, но может быть в doc
        });
    }

    async findById(id: string): Promise<Customer | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return null; // Не ошибка, просто неверный формат ID
        }
        try {
            // Используем lean() для производительности
            const doc = await CustomerModel.findById(id).lean().exec();
            return this.mapToDomain(doc);
        } catch (error) {
            console.error(`Error finding customer by ID ${id}:`, error);
            // Не пробрасываем AppError здесь, пусть UseCase решает, 404 это или 500
            throw new Error('Ошибка при поиске клиента по ID'); // Генерируем стандартную ошибку
        }
    }

    // --- ИЗМЕНЕНО: Убран userId, ищем глобально ---
    async findByInn(inn: string): Promise<Customer | null> {
        if (!inn) {
            return null;
        }
        try {
            // Ищем глобально
            const doc = await CustomerModel.findOne({ inn: inn }).lean().exec();
            return this.mapToDomain(doc);
        } catch (error) {
            console.error(`Error finding customer by INN ${inn}:`, error);
            throw new Error('Ошибка при поиске клиента по ИНН');
        }
    }

    async create(data: CreateCustomerData): Promise<Customer> {
        // --- ИЗМЕНЕНО: Проверка на глобальную уникальность ИНН ---
        if (data.inn) {
            const existingByInn = await this.findByInn(data.inn);
            if (existingByInn) {
                // Возможно, стоит вернуть ошибку, а не существующего клиента,
                // т.к. пользователь пытался создать дубликат.
                // Зависит от бизнес-логики. Здесь возвращаем ошибку 409.
                throw new AppError(
                    `Клиент с ИНН ${data.inn} уже существует в системе.`,
                    409,
                );
                // return existingByInn; // Старая логика
            }
        }

        try {
            const newCustomerDoc = new CustomerModel({
                name: data.name,
                inn: data.inn,
                contactInfo: data.contactInfo,
                userId: new mongoose.Types.ObjectId(data.userId), // Сохраняем ID создателя
            });
            const savedDoc = await newCustomerDoc.save();
            // Маппим из toObject(), так как lean() не используется при save()
            const mappedCustomer = this.mapToDomain(savedDoc.toObject());
            if (!mappedCustomer) {
                // Эта ситуация маловероятна, но для полноты
                throw new AppError(
                    'Не удалось смаппить клиента после создания',
                    500,
                );
            }
            return mappedCustomer;
        } catch (error: any) {
            // Обработка ошибки уникального индекса (предполагаем, что индекс только на 'inn')
            if (error.code === 11000 && error.keyPattern?.inn) {
                throw new AppError(
                    `Клиент с ИНН ${data.inn} уже существует (ошибка уникальности).`,
                    409,
                );
            }
            // Обработка ошибок валидации Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(
                    `Ошибка валидации при создании клиента: ${messages}`,
                    400,
                );
            }
            // Логируем и пробрасываем остальные ошибки
            console.error(`Error creating customer ${data.name}:`, error);
            throw new AppError('Ошибка при создании клиента', 500);
        }
    }

    async findAll(
        options: FindAllCustomersOptions,
    ): Promise<{ customers: Customer[]; total: number }> {
        // --- ИЗМЕНЕНО: Убрана логика, связанная с userId ---
        const {
            limit = 10,
            offset = 0,
            sortBy = 'name', // Сортировка по имени по умолчанию
            sortOrder = 'asc',
            // filter // Опционально: добавить обработку фильтров, если нужно
        } = options;

        // Глобальный фильтр (пока пустой, можно добавить поиск по имени/ИНН)
        const filterQuery: FilterQuery<ICustomerDocument> = {};
        // if (filter?.name) { filterQuery.name = new RegExp(filter.name, 'i'); }
        // if (filter?.inn) { filterQuery.inn = filter.inn; }

        const sortQuery: { [key: string]: 1 | -1 } = {};
        // Валидация sortBy, чтобы избежать NoSQL инъекций, если поле не разрешено
        const allowedSortFields = ['name', 'inn', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name'; // Поле по умолчанию, если передано невалидное
        sortQuery[sortField] = sortOrder === 'asc' ? 1 : -1;

        try {
            const [customerDocs, total] = await Promise.all([
                CustomerModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean() // <-- Используем lean()
                    .exec(),
                CustomerModel.countDocuments(filterQuery),
            ]);

            // Маппим простые объекты из lean()
            const customers = customerDocs
                .map((doc) => this.mapToDomain(doc))
                .filter((customer): customer is Customer => customer !== null); // Отфильтровываем null на всякий случай

            return { customers, total };
        } catch (dbError: any) {
            console.error(`Error in findAll customers:`, dbError);
            throw new AppError(
                'Ошибка базы данных при получении списка клиентов',
                500,
            );
        }
    }

    // --- ИЗМЕНЕНО: Убран userId из параметров и фильтра ---
    async update(
        id: string,
        data: UpdateCustomerData,
    ): Promise<Customer | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return null;
        }

        // Создаем объект $set только с переданными полями
        const updateFields: Partial<ICustomerDocument> = {};
        if (data.name !== undefined) {
            updateFields.name = data.name;
        }
        // Обработка contactInfo: null должен удалять поле или ставить null в БД,
        // undefined - не трогать поле. Mongoose `$set` с undefined игнорирует поле.
        // Если нужно явно установить null, используем `$set: { contactInfo: null }`
        // Если нужно убрать поле, используем `$unset: { contactInfo: "" }`
        // Для простоты, если пришел null, ставим null, иначе ставим значение.
        if (data.contactInfo !== undefined) {
            updateFields.contactInfo =
                data.contactInfo === null ? undefined : data.contactInfo;
        }

        // Если нечего обновлять, просто вернем текущего клиента
        if (Object.keys(updateFields).length === 0) {
            console.warn(
                `Update called for customer ${id} with no fields to update.`,
            );
            return this.findById(id); // Используем findById для получения актуальных данных
        }

        try {
            const updatedCustomerDoc = await CustomerModel.findByIdAndUpdate(
                id, // Находим только по ID
                { $set: updateFields },
                { new: true, runValidators: true },
            )
                .lean() // <-- Используем lean()
                .exec();

            return this.mapToDomain(updatedCustomerDoc);
        } catch (dbError: any) {
            console.error(`Error updating customer ${id}:`, dbError);
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(
                    `Ошибка валидации при обновлении клиента: ${messages}`,
                    400,
                );
            }
            // Обработка ошибки уникального индекса INN при обновлении (если INN можно менять)
            if (dbError.code === 11000 && dbError.keyPattern?.inn) {
                throw new AppError(
                    `ИНН ${updateFields.inn} уже используется другим клиентом.`,
                    409,
                );
            }
            throw new AppError(
                'Ошибка базы данных при обновлении клиента',
                500,
            );
        }
    }

    // --- ИЗМЕНЕНО: Убран userId из параметров и фильтра ---
    async delete(id: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return false;
        }
        try {
            const result = await CustomerModel.deleteOne({ _id: id }).exec(); // Удаляем только по ID
            // result.deletedCount === 1 будет true, если удаление успешно
            return result.deletedCount > 0;
        } catch (dbError: any) {
            console.error(`Error deleting customer ${id}:`, dbError);
            throw new AppError('Ошибка базы данных при удалении клиента', 500);
        }
    }
}
