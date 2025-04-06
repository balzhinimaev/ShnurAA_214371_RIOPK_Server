// src/infrastructure/database/mongoose/repositories/MongoUserRepository.ts
import { injectable } from 'tsyringe';
import { IUserRepository } from './IUserRepository';
import { AppError } from '../../application/errors/AppError';
import { IUserDocument, UserModel } from '../../infrastructure/database/mongoose/schemas/user.schema';
import { User, UserRole, CreateUserProps } from '../entities/user.entity';
// Используем относительные пути, предполагая, что IUserRepository находится в domain/repositories

// Используем абсолютный путь к схеме, как в вашем примере

// Используем абсолютный путь к AppError

// Используем абсолютный путь к сущности User

@injectable()
export class MongoUserRepository implements IUserRepository {
    private mapToDomain(userDoc: IUserDocument | null): User | null {
        if (!userDoc) {
            return null;
        }
        const userObject = userDoc.toObject();

        if (
            !userObject.id ||
            !userObject.name ||
            !userObject.email ||
            !userObject.passwordHash ||
            !userObject.roles ||
            !userObject.createdAt ||
            !userObject.updatedAt
        ) {
            console.error('Incomplete user object from database:', userObject);
            // --- ИСПРАВЛЕНИЕ AppError ---
            // Передаем только message и statusCode
            throw new AppError(
                'Неполные данные пользователя получены из базы данных',
                500,
            );
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        }

        const userProps = {
            id: userObject.id,
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles as UserRole[],
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        };
        return new User(userProps);
    }

    async create(data: CreateUserProps): Promise<User> {
        try {
            const newUserDoc = await UserModel.create({
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
                roles: data.roles,
            });

            const mappedUser = this.mapToDomain(newUserDoc);
            if (!mappedUser) {
                // --- ИСПРАВЛЕНИЕ AppError ---
                throw new AppError(
                    'Не удалось создать или смаппить пользователя после создания',
                    500,
                );
                // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
            }
            return mappedUser;
        } catch (error: any) {
            console.error('Error creating user:', error); // Логируем исходную ошибку
            if (error.code === 11000 && error.keyPattern?.email) {
                // --- ИСПРАВЛЕНИЕ AppError ---
                // Передаем message, statusCode, isOperational=true
                throw new AppError(
                    'Пользователь с таким Email уже существует',
                    409,
                    true, // Ошибка дубликата - ожидаемая операционная ошибка
                );
                // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
            }
            // --- ИСПРАВЛЕНИЕ AppError ---
            // Передаем message, statusCode, isOperational=false
            throw new AppError(
                'Ошибка при создании пользователя в базе данных',
                500,
                false, // Неожиданная ошибка БД - не операционная
            );
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            const userDoc = await UserModel.findOne({
                email: email.toLowerCase(),
            }).exec();
            return this.mapToDomain(userDoc);
        } catch (error: any) {
            console.error('Error finding user by email:', error); // Логируем исходную ошибку
            // --- ИСПРАВЛЕНИЕ AppError ---
            throw new AppError(
                'Ошибка при поиске пользователя по email',
                500,
                false, // Неожиданная ошибка БД
            );
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        }
    }

    async findById(id: string): Promise<User | null> {
        // Проверка валидности ID остается
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        try {
            const userDoc = await UserModel.findById(id).exec();
            return this.mapToDomain(userDoc);
        } catch (error: any) {
            console.error('Error finding user by id:', error); // Логируем исходную ошибку
            // --- ИСПРАВЛЕНИЕ AppError ---
            throw new AppError(
                'Ошибка при поиске пользователя по ID',
                500,
                false, // Неожиданная ошибка БД
            );
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        }
    }
}
