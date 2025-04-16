// src/application/use-cases/users/get-user-by-id.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IUserRepository,
    UserRepositoryToken,
} from '../../../domain/repositories/IUserRepository';
import { UserResponseDto } from '../../dtos/auth/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class GetUserByIdUseCase {
    constructor(
        @inject(UserRepositoryToken)
        private userRepository: IUserRepository,
    ) {}

    /**
     * Получает пользователя по ID.
     * @param userId - ID искомого пользователя.
     * @returns UserResponseDto если пользователь найден, иначе null.
     */
    async execute(userId: string): Promise<UserResponseDto | null> {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return null; // Пользователь не найден
            }

            // Преобразуем в DTO
            const userDto = plainToInstance(UserResponseDto, user, {
                excludeExtraneousValues: true,
            });

            return userDto;
        } catch (error) {
            console.error(
                `Error in GetUserByIdUseCase for ID ${userId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить пользователя по ID', 500);
        }
    }
}
