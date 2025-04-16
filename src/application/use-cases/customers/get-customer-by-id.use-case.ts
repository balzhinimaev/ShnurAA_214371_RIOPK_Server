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
     * Получает клиента по его глобальному ID.
     * @param customerId - ID клиента.
     * @returns Данные клиента в виде CustomerResponseDto.
     * @throws {AppError} Если клиент не найден (404) или произошла ошибка БД (500).
     */
    async execute(customerId: string): Promise<CustomerResponseDto> {
        try {
            const customer = await this.customerRepository.findById(customerId);

            if (!customer) {
                throw new AppError('Клиент не найден', 404);
            }

            return plainToInstance(CustomerResponseDto, customer, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            console.error(
                `Error in GetCustomerByIdUseCase for ID ${customerId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить данные клиента', 500);
        }
    }
}
