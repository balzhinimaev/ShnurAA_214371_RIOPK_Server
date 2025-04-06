// src/infrastructure/database/mongoose/repositories/user.repository.ts
import { injectable, inject } from 'tsyringe';
import mongoose, { Connection, Model } from 'mongoose';
// Корректные относительные пути к доменным сущностям и интерфейсам
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import {
    User,
    CreateUserProps,
    UserRole,
} from '../../../../domain/entities/user.entity';
// Путь к схеме
import { UserSchema, IUserDocument } from '../schemas/user.schema';
// Путь к AppError
import { AppError } from '../../../../application/errors/AppError';

export const MongooseConnectionToken = Symbol.for('MongooseConnection');

@injectable()
export class MongoUserRepository implements IUserRepository {
    private userModel: Model<IUserDocument>;
    private connectionInstanceId?: string;

    constructor(
        @inject(MongooseConnectionToken) private connection: Connection,
    ) {
        const constructorCallId = `REPO_CONSTRUCTOR_${Date.now()}`;
        console.log(
            `---- [${constructorCallId}] MongoUserRepository Constructor CALLED ----`,
        );
        console.log(
            `[${constructorCallId}] Received connection type: ${typeof this.connection}`,
        );

        if (this.connection && typeof this.connection.model === 'function') {
            // Добавим проверку на model
            this.connectionInstanceId = (
                this.connection as any
            )._instanceIdFromSetup;
            console.log(
                `[${constructorCallId}] Received connection readyState: ${this.connection.readyState}`,
            );
            console.log(
                `[${constructorCallId}] Received connection instance ID: ${this.connectionInstanceId}`,
            );

            // Пытаемся получить модель. Если схема уже была зарегистрирована на этом connection, все будет ОК.
            try {
                // Если схема уже зарегистрирована на этом соединении, используем ее
                if (this.connection.models['User']) {
                    this.userModel =
                        this.connection.model<IUserDocument>('User');
                    console.log(
                        `[${constructorCallId}] Reused existing model 'User' from connection.`,
                    );
                } else {
                    // Иначе регистрируем схему на этом соединении
                    this.userModel = this.connection.model<IUserDocument>(
                        'User',
                        UserSchema,
                    );
                    console.log(
                        `[${constructorCallId}] Registered and obtained model 'User' from connection.`,
                    );
                }
            } catch (modelError) {
                console.error(
                    `[${constructorCallId}] CRITICAL: Error obtaining model from connection!`,
                    modelError,
                );
                throw new AppError(
                    'Ошибка получения модели пользователя из соединения БД',
                    500,
                    false,
                );
            }
        } else {
            console.error(
                `[${constructorCallId}] CRITICAL: Received connection is invalid or lacks 'model' function! Cannot get model.`,
            );
            throw new AppError(
                'Невалидное соединение с БД получено в репозитории',
                500,
                false,
            );
        }
        console.log(
            `---- [${constructorCallId}] MongoUserRepository Constructor FINISHED ----`,
        );
    }

    // --- mapToDomain ---
    // Принимает как полный документ, так и lean-объект
    private mapToDomain(userDocOrObject: IUserDocument | any): User | null {
        if (!userDocOrObject) {
            return null;
        }
        // Если это Mongoose документ, используем toObject(), иначе используем как есть (lean)
        const userObject =
            typeof userDocOrObject.toObject === 'function'
                ? userDocOrObject.toObject()
                : userDocOrObject;

        // Проверка на _id или id после toObject()
        const id = userObject.id || userObject._id?.toString();

        if (
            !id ||
            !userObject.name ||
            !userObject.email ||
            !userObject.passwordHash ||
            !userObject.roles ||
            !userObject.createdAt ||
            !userObject.updatedAt
        ) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}] Error mapping to domain: Incomplete data`,
                userObject,
            );
            // Используем AppError
            throw new AppError(
                'Неполные данные пользователя для маппинга в доменную сущность',
                500,
                false,
            );
        }

        return new User({
            id: id,
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles as UserRole[], // Приведение типа
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        });
    }

    // --- findByEmail ---
    async findByEmail(email: string): Promise<User | null> {
        const operationId = `findByEmail_${Date.now()}`;
        console.log(
            `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] findByEmail called for: ${email}. Current readyState: ${this.connection?.readyState}`,
        );

        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`,
            );
            // Используем AppError
            throw new AppError(
                `Соединение с БД не готово (state: ${this.connection?.readyState})`,
                503,
                false,
            ); // 503 Service Unavailable
        }
        try {
            const userDoc = await this.userModel
                .findOne({ email: email.toLowerCase() })
                .lean() // Оставляем lean для производительности
                .exec();
            return this.mapToDomain(userDoc); // mapToDomain должен уметь работать с lean-объектом
        } catch (dbError: any) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in findByEmail:`,
                dbError,
            );
            // Используем AppError
            throw new AppError(
                'Ошибка базы данных при поиске пользователя по email',
                500,
                false,
            );
        }
    }

    // --- findById ---
    async findById(id: string): Promise<User | null> {
        const operationId = `findById_${Date.now()}`;
        console.log(
            `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] findById called for: ${id}. Current readyState: ${this.connection?.readyState}`,
        );

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Invalid ObjectId format: ${id}`,
            );
            return null;
        }

        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`,
            );
            throw new AppError(
                `Соединение с БД не готово (state: ${this.connection?.readyState})`,
                503,
                false,
            );
        }
        try {
            const userDoc = await this.userModel.findById(id).lean().exec(); // Оставляем lean
            return this.mapToDomain(userDoc);
        } catch (dbError: any) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in findById:`,
                dbError,
            );
            throw new AppError(
                'Ошибка базы данных при поиске пользователя по ID',
                500,
                false,
            );
        }
    }

    // --- create ---
    async create(data: CreateUserProps): Promise<User> {
        const operationId = `create_${Date.now()}`;
        console.log(
            `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] create called for: ${data.email}. Current readyState: ${this.connection?.readyState}`,
        );

        if (!this.userModel || this.connection?.readyState !== 1) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Connection not ready or model missing! State: ${this.connection?.readyState}`,
            );
            throw new AppError(
                `Соединение с БД не готово (state: ${this.connection?.readyState})`,
                503,
                false,
            );
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
                console.error(
                    `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] Failed to map user after successful creation:`,
                    newUserDoc,
                );
                throw new AppError(
                    'Не удалось смаппить пользователя после создания',
                    500,
                    false,
                );
            }
            console.log(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] User created successfully: ${mappedUser.id}`,
            );
            return mappedUser;
        } catch (dbError: any) {
            console.error(
                `[${this.connectionInstanceId ?? 'UNKNOWN_CONN'}][${operationId}] DB error in create:`,
                dbError,
            );
            if (dbError.code === 11000 && dbError.keyPattern?.email) {
                // Используем AppError для конфликта
                throw new AppError(
                    'Пользователь с таким Email уже существует',
                    409,
                    true,
                );
            }
            // Используем AppError для других ошибок БД
            throw new AppError(
                'Ошибка базы данных при создании пользователя',
                500,
                false,
            );
        }
    }
}
