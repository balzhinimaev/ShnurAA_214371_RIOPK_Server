// src/domain/repositories/IUserRepository.ts
import { User, CreateUserProps } from '../entities/user.entity';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: CreateUserProps): Promise<User>;
    // save(user: User): Promise<User>; // Метод save может быть не нужен, если create возвращает User
    // delete(id: string): Promise<boolean>; // Если нужно удаление
    // findAll(options?: { page: number; limit: number }): Promise<{ items: User[]; total: number }>; // Для списка пользователей
}

// Используем Symbol для токена инъекции (хорошая практика для DI)
export const UserRepositoryToken = Symbol('IUserRepository');
