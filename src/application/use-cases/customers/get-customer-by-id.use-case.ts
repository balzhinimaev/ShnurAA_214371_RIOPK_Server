// src/application/use-cases/customers/get-customer-by-id.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class GetCustomerByIdUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    /**
     * Получает клиента по его ID.
     * Примечание: Не проверяет принадлежность пользователю, это должен делать контроллер или middleware.
     * @param customerId - ID искомого клиента.
     * @returns CustomerResponseDto если клиент найден, иначе null.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(customerId: string): Promise<CustomerResponseDto | null> {
        try {
            // Ищем клиента по ID
            const customer = await this.customerRepository.findById(customerId);

            if (!customer) {
                return null; // Клиент не найден
            }

            // Преобразуем в DTO
            const customerDto = plainToInstance(CustomerResponseDto, customer, {
                excludeExtraneousValues: true,
            });

            return customerDto;
        } catch (error) {
            console.error(
                `Error in GetCustomerByIdUseCase for ID ${customerId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить клиента по ID', 500);
        }
    }
}
