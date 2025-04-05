// src/application/interfaces/IPasswordHasher.ts
export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
}
export const PasswordHasherToken = Symbol('IPasswordHasher');
