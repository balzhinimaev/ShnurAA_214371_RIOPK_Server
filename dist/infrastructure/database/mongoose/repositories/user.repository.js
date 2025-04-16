"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = exports.MongooseConnectionToken = void 0;
// src/infrastructure/database/mongoose/repositories/user.repository.ts
const tsyringe_1 = require("tsyringe");
const mongoose_1 = __importStar(require("mongoose"));
const user_entity_1 = require("../../../../domain/entities/user.entity");
// Путь к схеме
const user_schema_1 = require("../schemas/user.schema");
// Путь к AppError
const AppError_1 = require("../../../../application/errors/AppError");
exports.MongooseConnectionToken = Symbol.for('MongooseConnection');
let MongoUserRepository = class MongoUserRepository {
    constructor(connection) {
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: connection
        });
        Object.defineProperty(this, "userModel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connectionInstanceId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const constructorCallId = `REPO_CONSTRUCTOR_${Date.now()}`;
        console.log(`---- [${constructorCallId}] MongoUserRepository Constructor CALLED ----`);
        console.log(`[${constructorCallId}] Received connection type: ${typeof this.connection}`);
        if (this.connection && typeof this.connection.model === 'function') {
            // Добавим проверку на model
            this.connectionInstanceId = this.connection._instanceIdFromSetup;
            console.log(`[${constructorCallId}] Received connection readyState: ${this.connection.readyState}`);
            console.log(`[${constructorCallId}] Received connection instance ID: ${this.connectionInstanceId}`);
            // Пытаемся получить модель. Если схема уже была зарегистрирована на этом connection, все будет ОК.
            try {
                // Если схема уже зарегистрирована на этом соединении, используем ее
                if (this.connection.models['User']) {
                    this.userModel =
                        this.connection.model('User');
                    console.log(`[${constructorCallId}] Reused existing model 'User' from connection.`);
                }
                else {
                    // Иначе регистрируем схему на этом соединении
                    this.userModel = this.connection.model('User', user_schema_1.UserSchema);
                    console.log(`[${constructorCallId}] Registered and obtained model 'User' from connection.`);
                }
            }
            catch (modelError) {
                console.error(`[${constructorCallId}] CRITICAL: Error obtaining model from connection!`, modelError);
                throw new AppError_1.AppError('Ошибка получения модели пользователя из соединения БД', 500, false);
            }
        }
        else {
            console.error(`[${constructorCallId}] CRITICAL: Received connection is invalid or lacks 'model' function! Cannot get model.`);
            throw new AppError_1.AppError('Невалидное соединение с БД получено в репозитории', 500, false);
        }
        console.log(`---- [${constructorCallId}] MongoUserRepository Constructor FINISHED ----`);
    }
    // --- mapToDomain ---
    // Принимает как полный документ, так и lean-объект
    mapToDomain(userDocOrObject) {
        if (!userDocOrObject) {
            return null;
        }
        // Если это Mongoose документ, используем toObject(), иначе используем как есть (lean)
        const userObject = typeof userDocOrObject.toObject === 'function'
            ? userDocOrObject.toObject()
            : userDocOrObject;
        // Проверка на _id или id после toObject()
        const id = userObject.id || userObject._id?.toString();
        if (!id ||
            !userObject.name ||
            !userObject.email ||
            !userObject.passwordHash ||
            !userObject.roles ||
            !userObject.createdAt ||
            !userObject.updatedAt) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}] Error mapping to domain: Incomplete data`, userObject);
            // Используем AppError
            throw new AppError_1.AppError('Неполные данные пользователя для маппинга в доменную сущность', 500, false);
        }
        return new user_entity_1.User({
            id: id,
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles, // Приведение типа
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        });
    }
    // --- findByEmail ---
    async findByEmail(email) {
        const operationId = `findByEmail_${Date.now()}`;
        console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] findByEmail called for: ${email}. Current readyState: ${this.connection?.readyState}`);
        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`);
            // Используем AppError
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false); // 503 Service Unavailable
        }
        try {
            const userDoc = await this.userModel
                .findOne({ email: email.toLowerCase() })
                .lean() // Оставляем lean для производительности
                .exec();
            return this.mapToDomain(userDoc); // mapToDomain должен уметь работать с lean-объектом
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in findByEmail:`, dbError);
            // Используем AppError
            throw new AppError_1.AppError('Ошибка базы данных при поиске пользователя по email', 500, false);
        }
    }
    // --- findById ---
    async findById(id) {
        const operationId = `findById_${Date.now()}`;
        console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] findById called for: ${id}. Current readyState: ${this.connection?.readyState}`);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            console.warn(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Invalid ObjectId format: ${id}`);
            return null;
        }
        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`);
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false);
        }
        try {
            const userDoc = await this.userModel.findById(id).lean().exec(); // Оставляем lean
            return this.mapToDomain(userDoc);
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in findById:`, dbError);
            throw new AppError_1.AppError('Ошибка базы данных при поиске пользователя по ID', 500, false);
        }
    }
    // --- create ---
    async create(data) {
        const operationId = `create_${Date.now()}`;
        console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] create called for: ${data.email}. Current readyState: ${this.connection?.readyState}`);
        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`);
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false);
        }
        try {
            // Не используем .lean() здесь, так как нужен полный документ для save() и toObject()
            const userToSaveData = {
                name: data.name,
                email: data.email.toLowerCase(),
                passwordHash: data.passwordHash,
                roles: data.roles,
            };
            // Создаем и сохраняем
            const newUserDoc = await this.userModel.create(userToSaveData); // Используем create для атомарности
            const mappedUser = this.mapToDomain(newUserDoc); // Передаем Mongoose doc
            if (!mappedUser) {
                // Эта ошибка маловероятна если create успешен, но проверим
                console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Failed to map user after successful creation:`, newUserDoc);
                throw new AppError_1.AppError('Не удалось смаппить пользователя после создания', 500, false);
            }
            console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] User created successfully: ${mappedUser.id}`);
            return mappedUser;
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in create:`, dbError);
            if (dbError.code === 11000 && dbError.keyPattern?.email) {
                // Используем AppError для конфликта
                throw new AppError_1.AppError('Пользователь с таким Email уже существует', 409, true);
            }
            // Используем AppError для других ошибок БД
            throw new AppError_1.AppError('Ошибка базы данных при создании пользователя', 500, false);
        }
    }
    // --- findAll ---
    async findAll(options = {}) {
        const operationId = `findAll_${Date.now()}`;
        // console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] findAll called`); // Опциональный лог
        if (!this.userModel || this.connection?.readyState !== 1) {
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false);
        }
        const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', } = options;
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
        try {
            const [userDocs, total] = await Promise.all([
                this.userModel
                    .find({})
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.userModel.countDocuments({}),
            ]);
            const users = userDocs
                .map((doc) => this.mapToDomain(doc))
                .filter((user) => user !== null);
            return { users, total };
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in findAll:`, dbError);
            throw new AppError_1.AppError('Ошибка базы данных при получении списка пользователей', 500, false);
        }
    }
    // --- update ---
    async update(id, data) {
        const operationId = `update_${Date.now()}`;
        // console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] update called for ID: ${id}`); // Опциональный лог
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return null;
        }
        if (!this.userModel || this.connection?.readyState !== 1) {
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false);
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.roles !== undefined)
            updateData.roles = data.roles;
        if (Object.keys(updateData).length === 0) {
            // console.warn(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] No valid data for update on user ${id}.`); // Опциональный лог
            const currentUser = await this.findById(id); // Возвращаем без изменений
            return currentUser;
        }
        try {
            const updatedUserDoc = await this.userModel
                .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
                .lean()
                .exec();
            if (!updatedUserDoc) {
                return null; // Не найден
            }
            return this.mapToDomain(updatedUserDoc);
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in update for user ${id}:`, dbError);
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e) => e.message)
                    .join(', ');
                throw new AppError_1.AppError(`Ошибка валидации при обновлении пользователя: ${messages}`, 400);
            }
            throw new AppError_1.AppError('Ошибка базы данных при обновлении пользователя', 500, false);
        }
    }
    // --- delete ---
    async delete(id) {
        const operationId = `delete_${Date.now()}`;
        // console.log(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] delete called for ID: ${id}`); // Опциональный лог
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return false;
        }
        if (!this.userModel || this.connection?.readyState !== 1) {
            throw new AppError_1.AppError(`Соединение с БД не готово (state: ${this.connection?.readyState})`, 503, false);
        }
        try {
            const result = await this.userModel.deleteOne({ _id: id }).exec();
            return result.deletedCount > 0;
        }
        catch (dbError) {
            console.error(`[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in delete for user ${id}:`, dbError);
            throw new AppError_1.AppError('Ошибка базы данных при удалении пользователя', 500, false);
        }
    }
};
exports.MongoUserRepository = MongoUserRepository;
exports.MongoUserRepository = MongoUserRepository = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(exports.MongooseConnectionToken)),
    __metadata("design:paramtypes", [mongoose_1.Connection])
], MongoUserRepository);
//# sourceMappingURL=user.repository.js.map