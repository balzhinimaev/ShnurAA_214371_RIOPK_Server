// src/application/use-cases/customers/update-customer.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    UpdateCustomerData, // Используем тип из репозитория
} from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';
import { UserRole } from '../../../domain/entities/user.entity'; // Предполагаем, что тип роли есть

@injectable()
export class UpdateCustomerUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    /**
     * Обновляет данные глобального клиента.
     * Проверяет, имеет ли пользователь права на обновление (ADMIN или ANALYST).
     * @param customerId - ID обновляемого клиента.
     * @param actingUserRoles - Роли пользователя, выполняющего действие.
     * @param data - Данные для обновления.
     * @returns Обновленные данные клиента в виде CustomerResponseDto.
     * @throws {AppError} Если нет прав (403), клиент не найден (404), или ошибка БД (500).
     */
    async execute(
        customerId: string,
        actingUserRoles: UserRole[], // Принимаем роли для проверки
        data: UpdateCustomerData,
    ): Promise<CustomerResponseDto> {
        // --- ДОБАВЛЕНО: Проверка прав ---
        const allowedRoles: UserRole[] = ['ADMIN', 'ANALYST'];
        if (!actingUserRoles?.some((role) => allowedRoles.includes(role))) {
            throw new AppError(
                'Доступ запрещен: недостаточно прав для обновления клиента',
                403,
            );
        }

        try {
            // --- ИЗМЕНЕНО: Вызываем update без userId ---
            const updatedCustomer = await this.customerRepository.update(
                customerId,
                data,
            );

            if (!updatedCustomer) {
                // Репозиторий вернет null, если ID не найден
                throw new AppError('Клиент для обновления не найден', 404);
            }

            return plainToInstance(CustomerResponseDto, updatedCustomer, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            console.error(
                `Error in UpdateCustomerUseCase for ID ${customerId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось обновить клиента', 500);
        }
    }
}
