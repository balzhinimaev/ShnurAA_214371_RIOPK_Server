// src/domain/repositories/IUserRepository.ts
import { User, UserRole } from '../entities/user.entity';

// Опции для пагинации и сортировки (пример)
export interface FindAllUsersOptions {
    limit?: number;
    offset?: number;
    sortBy?: keyof User | string; // Поля User или кастомные
    sortOrder?: 'asc' | 'desc';
    // Можно добавить фильтры по email, name, role...
    // filter?: { email?: string; name?: string; role?: UserRole };
}

// Данные для обновления пользователя
export interface UpdateUserData {
    name?: string;
    roles?: UserRole[];
    // Не позволяем менять email или пароль через этот метод
    // passwordHash?: string; // Пароль меняется отдельно
}

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: CreateUserProps): Promise<User>; // Этот для саморегистрации

    // --- НОВЫЕ МЕТОДЫ ---
    findAll(
        options?: FindAllUsersOptions,
    ): Promise<{ users: User[]; total: number }>;
    update(id: string, data: UpdateUserData): Promise<User | null>;
    delete(id: string): Promise<boolean>; // Возвращает true, если удален
    // createByAdmin?(data: CreateUserProps): Promise<User>; // Опционально, если нужен отдельный метод
    // --- КОНЕЦ НОВЫХ МЕТОДОВ ---
}

export const UserRepositoryToken = Symbol('IUserRepository');

// Перенесем CreateUserProps сюда для ясности, если он только здесь используется
export interface CreateUserProps {
    name: string;
    email: string;
    passwordHash: string; // Хешированный пароль
    roles: UserRole[];
}
