// src/domain/repositories/IUserRepository.ts
import { User, UserRole } from '../entities/user.entity';

// --- Helper Types ---

// Data needed to create a user
export interface CreateUserProps {
    name: string;
    email: string;
    passwordHash: string;
    roles: UserRole[];
}

// Options for finding multiple users
export interface FindAllUsersOptions {
    limit?: number;
    offset?: number;
    sortBy?: keyof User | string; // Allow sorting by known User fields or others
    sortOrder?: 'asc' | 'desc';
    filter?: {
        name?: string; // Example: filter by name (case-insensitive)
        role?: UserRole; // Example: filter by a specific role
    };
}

// Data allowed for updating a user
// Note: Typically email and password changes are handled via separate flows
export interface UpdateUserData {
    name?: string;
    roles?: UserRole[];
    // passwordHash?: string; // Add if direct password hash update is allowed
}

// --- Interface Definition ---

export interface IUserRepository {
    /** Creates a new user. */
    create(data: CreateUserProps): Promise<User>;

    /** Finds a user by their email (case-insensitive). */
    findByEmail(email: string): Promise<User | null>;

    /** Finds a user by their unique ID. */
    findById(id: string): Promise<User | null>;

    /** Finds all users with pagination, sorting, and filtering. */
    findAll(
        options: FindAllUsersOptions,
    ): Promise<{ users: User[]; total: number }>;

    /** Updates a user by their ID. */
    update(id: string, data: UpdateUserData): Promise<User | null>;

    /** Deletes a user by their ID. */
    delete(id: string): Promise<boolean>;
}

// Token for dependency injection
export const UserRepositoryToken = Symbol('IUserRepository');
