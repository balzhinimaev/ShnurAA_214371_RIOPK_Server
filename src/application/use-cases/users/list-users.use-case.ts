// src/application/use-cases/users/list-users.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IUserRepository,
    UserRepositoryToken,
    FindAllUsersOptions,
} from '../../../domain/repositories/IUserRepository';
import { UserResponseDto } from '../../dtos/auth/user-response.dto'; // Используем существующий DTO для ответа
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError'; // Для обработки ошибок репозитория

// Интерфейс для результата, возвращаемого Use Case
interface ListUsersResult {
    users: UserResponseDto[]; // Массив пользователей в формате DTO
    total: number; // Общее количество пользователей (для пагинации)
    offset: number; // Смещение, которое было использовано
    limit: number; // Лимит, который был использован
}

@injectable() // Делаем класс доступным для DI
export class ListUsersUseCase {
    constructor(
        // Внедряем репозиторий пользователей
        @inject(UserRepositoryToken)
        private userRepository: IUserRepository,
    ) {}

    /**
     * Получает список пользователей с пагинацией и сортировкой.
     * @param options - Параметры пагинации, сортировки (и фильтрации, если реализовано).
     * @returns Объект с массивом пользователей (DTO) и информацией для пагинации.
     */
    async execute(options: FindAllUsersOptions = {}): Promise<ListUsersResult> {
        try {
            // Вызываем метод репозитория для получения пользователей и общего количества
            const { users, total } = await this.userRepository.findAll(options);

            // Преобразуем каждую сущность User в UserResponseDto
            const userDtos = users.map((user) =>
                plainToInstance(UserResponseDto, user, {
                    excludeExtraneousValues: true, // Убираем поля без @Expose (например, passwordHash)
                }),
            );

            // Возвращаем результат в нужном формате
            return {
                users: userDtos,
                total,
                offset: options.offset ?? 0, // Возвращаем смещение (или 0 по умолчанию)
                limit: options.limit ?? 10, // Возвращаем лимит (или 10 по умолчанию)
            };
        } catch (error) {
            console.error('Error in ListUsersUseCase:', error);
            // Если ошибка известного типа (AppError), пробрасываем ее дальше
            if (error instanceof AppError) {
                throw error;
            }
            // Иначе оборачиваем в AppError
            throw new AppError('Не удалось получить список пользователей', 500);
        }
    }
}
