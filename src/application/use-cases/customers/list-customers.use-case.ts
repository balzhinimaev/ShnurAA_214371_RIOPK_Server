// src/application/use-cases/customers/list-customers.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    FindAllCustomersOptions, // Используем обновленный тип
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
     * Получает глобальный список клиентов с пагинацией и сортировкой.
     * @param options - Опции пагинации и сортировки (userId больше не нужен).
     * @returns Объект ListCustomersResponseDto с результатами.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(
        options: FindAllCustomersOptions, // Принимает обновленные опции
    ): Promise<ListCustomersResponseDto> {
        // --- ИЗМЕНЕНО: Убрана проверка userId ---
        // if (!options?.userId) { ... }

        try {
            // Вызываем метод репозитория без userId для фильтрации
            const { customers, total } =
                await this.customerRepository.findAll(options);

            const customerDtos = customers.map((customer) =>
                plainToInstance(CustomerResponseDto, customer, {
                    excludeExtraneousValues: true,
                }),
            );

            return plainToInstance(ListCustomersResponseDto, {
                customers: customerDtos,
                total,
                offset: options.offset ?? 0,
                limit: options.limit ?? 10,
            });
        } catch (error) {
            console.error(`Error in ListCustomersUseCase:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить список клиентов', 500);
        }
    }
}
