// src/application/use-cases/users/update-user.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IUserRepository,
    UserRepositoryToken,
    UpdateUserData, // Используем тип данных для обновления из репозитория
} from '../../../domain/repositories/IUserRepository';
import { UserResponseDto } from '../../dtos/auth/user-response.dto';
import { UpdateUserDto } from '../../dtos/users/update-user.dto'; // DTO с данными для обновления
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class UpdateUserUseCase {
    constructor(
        @inject(UserRepositoryToken)
        private userRepository: IUserRepository,
    ) {}

    /**
     * Обновляет данные пользователя (имя, роли).
     * @param userId - ID пользователя для обновления.
     * @param data - DTO с новыми данными (UpdateUserDto).
     * @returns Обновленный UserResponseDto если пользователь найден и обновлен, иначе null.
     */
    async execute(
        userId: string,
        data: UpdateUserDto,
    ): Promise<UserResponseDto | null> {
        // Преобразуем DTO в данные для репозитория (UpdateUserData)
        // Это необязательно, если типы совпадают, но для ясности можно сделать
        const updateData: UpdateUserData = {
            name: data.name,
            roles: data.roles,
        };

        // Убираем undefined поля, чтобы не перезаписать существующие значения на undefined
        Object.keys(updateData).forEach(
            (key) =>
                updateData[key as keyof UpdateUserData] === undefined &&
                delete updateData[key as keyof UpdateUserData],
        );

        // Проверяем, есть ли вообще данные для обновления
        if (Object.keys(updateData).length === 0) {
            console.warn(
                `UpdateUserUseCase: No actual data provided to update user ${userId}.`,
            );
            // Получаем и возвращаем текущего пользователя без изменений
            const currentUser = await this.userRepository.findById(userId);
            if (!currentUser) return null; // Если не нашли
            return plainToInstance(UserResponseDto, currentUser, {
                excludeExtraneousValues: true,
            });
        }

        try {
            // Вызываем метод репозитория для обновления
            const updatedUser = await this.userRepository.update(
                userId,
                updateData,
            );

            if (!updatedUser) {
                return null; // Пользователь не найден
            }

            // Преобразуем обновленную сущность в DTO
            const userDto = plainToInstance(UserResponseDto, updatedUser, {
                excludeExtraneousValues: true,
            });

            return userDto;
        } catch (error) {
            console.error(
                `Error in UpdateUserUseCase for ID ${userId}:`,
                error,
            );
            if (error instanceof AppError) {
                // Пробрасываем AppError (например, 400 из-за неверной роли)
                throw error;
            }
            throw new AppError('Не удалось обновить пользователя', 500);
        }
    }
}
