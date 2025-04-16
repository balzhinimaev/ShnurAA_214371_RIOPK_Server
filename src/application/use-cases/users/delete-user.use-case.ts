// src/application/use-cases/users/delete-user.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IUserRepository,
    UserRepositoryToken,
} from '../../../domain/repositories/IUserRepository';
import { AppError } from '../../errors/AppError';

@injectable()
export class DeleteUserUseCase {
    constructor(
        @inject(UserRepositoryToken)
        private userRepository: IUserRepository,
    ) {}

    /**
     * Удаляет пользователя по ID.
     * @param userId - ID пользователя для удаления.
     * @returns true если пользователь был удален, false если не найден.
     */
    async execute(userId: string): Promise<boolean> {
        try {
            // Вызываем метод репозитория для удаления
            const wasDeleted = await this.userRepository.delete(userId);
            return wasDeleted;
        } catch (error) {
            console.error(
                `Error in DeleteUserUseCase for ID ${userId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось удалить пользователя', 500);
        }
    }
}
