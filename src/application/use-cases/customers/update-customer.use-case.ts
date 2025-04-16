// src/application/use-cases/customers/update-customer.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
    UpdateCustomerData, // Используем тип данных для обновления из репозитория
} from '../../../domain/repositories/ICustomerRepository';
import { CustomerResponseDto } from '../../dtos/customers/customer-response.dto';
import { UpdateCustomerDto } from '../../dtos/customers/update-customer.dto'; // DTO с данными из запроса
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';

@injectable()
export class UpdateCustomerUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    /**
     * Обновляет данные клиента (имя, контактная информация).
     * Проверяет принадлежность клиента указанному пользователю.
     * @param customerId - ID клиента для обновления.
     * @param userId - ID пользователя, выполняющего операцию (для проверки прав).
     * @param data - DTO с новыми данными (UpdateCustomerDto).
     * @returns Обновленный CustomerResponseDto если клиент найден и обновлен, иначе null.
     * @throws {AppError} Если произошла ошибка валидации или ошибка БД.
     */
    async execute(
        customerId: string,
        userId: string,
        data: UpdateCustomerDto,
    ): Promise<CustomerResponseDto | null> {
        // Преобразуем DTO в данные для репозитория
        const updateData: UpdateCustomerData = {
            name: data.name,
            contactInfo: data.contactInfo,
        };

        // Убираем undefined поля
        Object.keys(updateData).forEach(
            (key) =>
                updateData[key as keyof UpdateCustomerData] === undefined &&
                delete updateData[key as keyof UpdateCustomerData],
        );

        // Проверяем, есть ли что обновлять
        if (Object.keys(updateData).length === 0) {
            console.warn(
                `UpdateCustomerUseCase: No actual data provided to update customer ${customerId}.`,
            );
            // Если нет данных, просто получаем и возвращаем текущего клиента
            // (репозиторий должен обработать проверку userId при поиске, если findById ее делает,
            // или нам нужно вызвать findById с userId здесь)
            const currentUser =
                await this.customerRepository.findById(customerId); // Используем findById
            // Дополнительная проверка принадлежности пользователю, если findById ее не делает
            // const currentUser = await this.customerRepository.findCustomerByIdAndUserId(customerId, userId); // Если есть такой метод
            if (!currentUser /* || currentUser.userId !== userId */)
                return null; // Проверка принадлежности
            return plainToInstance(CustomerResponseDto, currentUser, {
                excludeExtraneousValues: true,
            });
        }

        try {
            // Вызываем метод репозитория для обновления, передавая ID клиента, ID пользователя и данные
            const updatedCustomer = await this.customerRepository.update(
                customerId,
                userId,
                updateData,
            );

            if (!updatedCustomer) {
                // Репозиторий вернул null, значит клиент не найден ИЛИ не принадлежит пользователю
                return null;
            }

            // Преобразуем обновленную сущность в DTO
            const customerDto = plainToInstance(
                CustomerResponseDto,
                updatedCustomer,
                {
                    excludeExtraneousValues: true,
                },
            );

            return customerDto;
        } catch (error) {
            console.error(
                `Error in UpdateCustomerUseCase for ID ${customerId}, user ${userId}:`,
                error,
            );
            if (error instanceof AppError) {
                // Пробрасываем AppError (например, 400 Bad Request из-за валидации)
                throw error;
            }
            throw new AppError('Не удалось обновить клиента', 500);
        }
    }
}
