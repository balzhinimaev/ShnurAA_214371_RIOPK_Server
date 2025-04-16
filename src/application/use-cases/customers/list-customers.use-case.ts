// src/application/use-cases/customers/list-customers.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    FindAllCustomersOptions, // Используем тип опций из репозитория
} from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { ListCustomersResponseDto } from '../../dtos/customers/list-customers-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class ListCustomersUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    /**
     * Получает список клиентов для указанного пользователя с пагинацией и сортировкой.
     * @param options - Опции поиска, включая обязательный userId.
     * @returns Объект ListCustomersResponseDto с результатами.
     * @throws {AppError} Если userId не предоставлен или произошла ошибка БД.
     */
    async execute(
        options: FindAllCustomersOptions,
    ): Promise<ListCustomersResponseDto> {
        // Валидация входных данных (userId обязателен)
        if (!options?.userId) {
            throw new AppError(
                'Не указан ID пользователя для поиска клиентов',
                400,
            );
        }

        try {
            // Вызываем метод репозитория
            const { customers, total } =
                await this.customerRepository.findAll(options);

            // Преобразуем сущности Customer в CustomerResponseDto
            const customerDtos = customers.map((customer) =>
                plainToInstance(CustomerResponseDto, customer, {
                    excludeExtraneousValues: true, // Убираем поля без @Expose
                }),
            );

            // Формируем и возвращаем DTO ответа
            // Используем plainToInstance для гарантии структуры ответа
            return plainToInstance(ListCustomersResponseDto, {
                customers: customerDtos,
                total,
                offset: options.offset ?? 0,
                limit: options.limit ?? 10, // Используем значения по умолчанию, если не переданы
            });
        } catch (error) {
            console.error(
                `Error in ListCustomersUseCase for user ${options.userId}:`,
                error,
            );
            if (error instanceof AppError) {
                // Пробрасываем AppError (например, 400 из-за невалидного userId в репозитории)
                throw error;
            }
            // Оборачиваем другие ошибки
            throw new AppError('Не удалось получить список клиентов', 500);
        }
    }
}
