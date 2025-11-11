"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoCustomerRepository = void 0;
// src/infrastructure/database/mongoose/repositories/customer.repository.ts
const tsyringe_1 = require("tsyringe");
const mongoose_1 = __importDefault(require("mongoose")); // Добавлен FilterQuery
const customer_entity_1 = require("../../../../domain/entities/customer.entity");
const customer_schema_1 = require("../schemas/customer.schema");
const AppError_1 = require("../../../../application/errors/AppError");
let MongoCustomerRepository = class MongoCustomerRepository {
    // Хелпер маппинга: принимает простой объект (из .lean())
    mapToDomain(doc) {
        if (!doc)
            return null;
        return new customer_entity_1.Customer({
            // Используем _id, если transform в схеме не настроен/не используется
            id: doc._id.toString(),
            name: doc.name,
            unp: doc.unp,
            contactInfo: doc.contactInfo,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            // userId здесь не нужен для доменной логики, но может быть в doc
        });
    }
    async findById(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return null; // Не ошибка, просто неверный формат ID
        }
        try {
            // Используем lean() для производительности
            const doc = await customer_schema_1.CustomerModel.findById(id).lean().exec();
            return this.mapToDomain(doc);
        }
        catch (error) {
            console.error(`Error finding customer by ID ${id}:`, error);
            // Не пробрасываем AppError здесь, пусть UseCase решает, 404 это или 500
            throw new Error('Ошибка при поиске клиента по ID'); // Генерируем стандартную ошибку
        }
    }
    // --- ИЗМЕНЕНО: Убран userId, ищем глобально ---
    async findByUnp(unp) {
        if (!unp) {
            return null;
        }
        try {
            // Ищем глобально
            const doc = await customer_schema_1.CustomerModel.findOne({ unp: unp }).lean().exec();
            return this.mapToDomain(doc);
        }
        catch (error) {
            console.error(`Error finding customer by УНП ${unp}:`, error);
            throw new Error('Ошибка при поиске клиента по УНП');
        }
    }
    async create(data) {
        // --- ИЗМЕНЕНО: Проверка на глобальную уникальность УНП ---
        if (data.unp) {
            const existingByUnp = await this.findByUnp(data.unp);
            if (existingByUnp) {
                // Возможно, стоит вернуть ошибку, а не существующего клиента,
                // т.к. пользователь пытался создать дубликат.
                // Зависит от бизнес-логики. Здесь возвращаем ошибку 409.
                throw new AppError_1.AppError(`Клиент с УНП ${data.unp} уже существует в системе.`, 409);
                // return existingByUnp; // Старая логика
            }
        }
        try {
            const newCustomerDoc = new customer_schema_1.CustomerModel({
                name: data.name,
                unp: data.unp,
                contactInfo: data.contactInfo,
                userId: new mongoose_1.default.Types.ObjectId(data.userId), // Сохраняем ID создателя
            });
            const savedDoc = await newCustomerDoc.save();
            // Маппим из toObject(), так как lean() не используется при save()
            const mappedCustomer = this.mapToDomain(savedDoc.toObject());
            if (!mappedCustomer) {
                // Эта ситуация маловероятна, но для полноты
                throw new AppError_1.AppError('Не удалось смаппить клиента после создания', 500);
            }
            return mappedCustomer;
        }
        catch (error) {
            // Обработка ошибки уникального индекса (предполагаем, что индекс только на 'unp')
            if (error.code === 11000 && error.keyPattern?.unp) {
                throw new AppError_1.AppError(`Клиент с УНП ${data.unp} уже существует (ошибка уникальности).`, 409);
            }
            // Обработка ошибок валидации Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e) => e.message)
                    .join(', ');
                throw new AppError_1.AppError(`Ошибка валидации при создании клиента: ${messages}`, 400);
            }
            // Логируем и пробрасываем остальные ошибки
            console.error(`Error creating customer ${data.name}:`, error);
            throw new AppError_1.AppError('Ошибка при создании клиента', 500);
        }
    }
    async findAll(options) {
        // --- ИЗМЕНЕНО: Убрана логика, связанная с userId ---
        const { limit = 10, offset = 0, sortBy = 'name', // Сортировка по имени по умолчанию
        sortOrder = 'asc',
        // filter // Опционально: добавить обработку фильтров, если нужно
         } = options;
        // Глобальный фильтр (пока пустой, можно добавить поиск по имени/ИНН)
        const filterQuery = {};
        // if (filter?.name) { filterQuery.name = new RegExp(filter.name, 'i'); }
        // if (filter?.unp) { filterQuery.unp = filter.unp; }
        const sortQuery = {};
        // Валидация sortBy, чтобы избежать NoSQL инъекций, если поле не разрешено
        const allowedSortFields = ['name', 'unp', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name'; // Поле по умолчанию, если передано невалидное
        sortQuery[sortField] = sortOrder === 'asc' ? 1 : -1;
        try {
            const [customerDocs, total] = await Promise.all([
                customer_schema_1.CustomerModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean() // <-- Используем lean()
                    .exec(),
                customer_schema_1.CustomerModel.countDocuments(filterQuery),
            ]);
            // Маппим простые объекты из lean()
            const customers = customerDocs
                .map((doc) => this.mapToDomain(doc))
                .filter((customer) => customer !== null); // Отфильтровываем null на всякий случай
            return { customers, total };
        }
        catch (dbError) {
            console.error(`Error in findAll customers:`, dbError);
            throw new AppError_1.AppError('Ошибка базы данных при получении списка клиентов', 500);
        }
    }
    // --- ИЗМЕНЕНО: Убран userId из параметров и фильтра ---
    async update(id, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return null;
        }
        // Создаем объект $set только с переданными полями
        const updateFields = {};
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
            console.warn(`Update called for customer ${id} with no fields to update.`);
            return this.findById(id); // Используем findById для получения актуальных данных
        }
        try {
            const updatedCustomerDoc = await customer_schema_1.CustomerModel.findByIdAndUpdate(id, // Находим только по ID
            { $set: updateFields }, { new: true, runValidators: true })
                .lean() // <-- Используем lean()
                .exec();
            return this.mapToDomain(updatedCustomerDoc);
        }
        catch (dbError) {
            console.error(`Error updating customer ${id}:`, dbError);
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e) => e.message)
                    .join(', ');
                throw new AppError_1.AppError(`Ошибка валидации при обновлении клиента: ${messages}`, 400);
            }
            // Обработка ошибки уникального индекса УНП при обновлении (если УНП можно менять)
            if (dbError.code === 11000 && dbError.keyPattern?.unp) {
                throw new AppError_1.AppError(`УНП ${updateFields.unp} уже используется другим клиентом.`, 409);
            }
            throw new AppError_1.AppError('Ошибка базы данных при обновлении клиента', 500);
        }
    }
    // --- ИЗМЕНЕНО: Убран userId из параметров и фильтра ---
    async delete(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid ObjectId format for customer ID: ${id}`);
            return false;
        }
        try {
            const result = await customer_schema_1.CustomerModel.deleteOne({ _id: id }).exec(); // Удаляем только по ID
            // result.deletedCount === 1 будет true, если удаление успешно
            return result.deletedCount > 0;
        }
        catch (dbError) {
            console.error(`Error deleting customer ${id}:`, dbError);
            throw new AppError_1.AppError('Ошибка базы данных при удалении клиента', 500);
        }
    }
};
exports.MongoCustomerRepository = MongoCustomerRepository;
exports.MongoCustomerRepository = MongoCustomerRepository = __decorate([
    (0, tsyringe_1.injectable)()
], MongoCustomerRepository);
//# sourceMappingURL=customer.repository.js.map