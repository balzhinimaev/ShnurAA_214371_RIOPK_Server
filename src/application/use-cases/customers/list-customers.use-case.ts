// src/application/use-cases/customers/list-customers.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    FindAllCustomersOptions, // Используем обновленный тип
} from '../../../domain/repositories/ICustomerRepository';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { ListCustomersResponseDto } from '../../dtos/customers/list-customers-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class ListCustomersUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
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

            // Получаем рисковость для каждого клиента
            const customerDtos = await Promise.all(
                customers.map(async (customer) => {
                    try {
                        const stats = await this.debtWorkRecordRepository.getCustomerStats(customer.id);
                        return plainToInstance(CustomerResponseDto, {
                            ...customer,
                            riskScore: stats.riskScore,
                            riskLevel: stats.riskLevel,
                        }, {
                            excludeExtraneousValues: true,
                        });
                    } catch (error) {
                        // Если не удалось получить статистику, возвращаем клиента без рисковости
                        console.warn(`Failed to get risk stats for customer ${customer.id}:`, error);
                        return plainToInstance(CustomerResponseDto, customer, {
                            excludeExtraneousValues: true,
                        });
                    }
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
