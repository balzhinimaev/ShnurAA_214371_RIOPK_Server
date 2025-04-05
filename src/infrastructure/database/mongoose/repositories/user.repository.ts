// src/infrastructure/database/mongoose/repositories/user.repository.ts
import { injectable } from 'tsyringe'; // Импортируем для DI
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { User, CreateUserProps } from '../../../../domain/entities/user.entity';
import { UserModel, IUserDocument } from '../schemas/user.schema';

@injectable() // Делаем класс доступным для DI
export class MongoUserRepository implements IUserRepository {
    // Приватный метод для маппинга документа Mongoose в нашу сущность User
    private mapToDomain(userDoc: IUserDocument): User {
        // Mongoose toObject() с нашим transform уже делает основную работу
        const userObject = userDoc.toObject();
        return new User({
            id: userObject.id,
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles,
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const userDoc = await UserModel.findOne({
            email: email.toLowerCase(),
        }).exec();
        return userDoc ? this.mapToDomain(userDoc) : null;
    }

    async findById(id: string): Promise<User | null> {
        // Проверка на валидность ObjectId (опционально, но полезно)
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }
        const userDoc = await UserModel.findById(id).exec();
        return userDoc ? this.mapToDomain(userDoc) : null;
    }

    async create(data: CreateUserProps): Promise<User> {
        // Не передаем id, createdAt, updatedAt - они генерятся Mongoose/MongoDB
        const newUserDoc = new UserModel({
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            roles: data.roles,
        });
        const savedDoc = await newUserDoc.save();
        return this.mapToDomain(savedDoc);
    }
}
