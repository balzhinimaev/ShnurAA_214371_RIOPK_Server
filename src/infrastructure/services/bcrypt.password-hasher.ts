// src/infrastructure/services/bcrypt.password-hasher.ts
import { injectable } from 'tsyringe';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../application/interfaces/IPasswordHasher';

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
    private readonly saltRounds = 10; // Рекомендуемое количество раундов

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

