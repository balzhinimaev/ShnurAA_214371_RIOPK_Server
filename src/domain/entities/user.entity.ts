// src/domain/entities/user.entity.ts
export type UserRole = 'ADMIN' | 'ANALYST' | 'MANAGER'; // Определяем возможные роли

export class User {
    public readonly id: string; // Используем string для ID (MongoDB ObjectId будет строкой)
    public name: string;
    public email: string;
    public passwordHash: string; // Храним хеш, а не пароль
    public roles: UserRole[];
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(props: {
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        roles: UserRole[];
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.roles = props.roles;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    // Можно добавить методы бизнес-логики сюда, если они связаны с User
    // public hasRole(role: UserRole): boolean {
    //   return this.roles.includes(role);
    // }
}

// Тип для создания пользователя (без полей, генерируемых БД или логикой)
export type CreateUserProps = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
