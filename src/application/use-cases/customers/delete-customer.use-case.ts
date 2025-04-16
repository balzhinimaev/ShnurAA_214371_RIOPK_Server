// src/application/use-cases/customers/delete-customer.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../errors/AppError';
import { UserRole } from '../../../domain/entities/user.entity'; // Предполагаем, что тип роли есть
// import { IInvoiceRepository, InvoiceRepositoryToken } from '../../../domain/repositories/IInvoiceRepository'; // Опционально для проверки счетов

@injectable()
export class DeleteCustomerUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository, // @inject(InvoiceRepositoryToken) // private invoiceRepository: IInvoiceRepository, // Опционально
    ) {}

    /**
     * Удаляет глобального клиента.
     * Проверяет, имеет ли пользователь права на удаление (только ADMIN).
     * @param customerId - ID удаляемого клиента.
     * @param actingUserRoles - Роли пользователя, выполняющего действие.
     * @returns true в случае успеха.
     * @throws {AppError} Если нет прав (403), клиент не найден (404), нельзя удалить (400), или ошибка БД (500).
     */
    async execute(
        customerId: string,
        actingUserRoles: UserRole[], // Принимаем роли для проверки
    ): Promise<boolean> {
        // --- ДОБАВЛЕНО: Проверка прав ---
        if (!actingUserRoles?.includes('ADMIN')) {
            throw new AppError(
                'Доступ запрещен: только администратор может удалять клиентов',
                403,
            );
        }

        // --- Опционально: Проверка связанных данных (например, неоплаченных счетов) ---
        // const openInvoices = await this.invoiceRepository.findOpenByCustomerId(customerId);
        // if (openInvoices && openInvoices.length > 0) {
        //     throw new AppError('Нельзя удалить клиента с активными счетами', 400);
        // }

        try {
            // --- ИЗМЕНЕНО: Вызываем delete без userId ---
            const deleted = await this.customerRepository.delete(customerId);

            if (!deleted) {
                // Репозиторий вернет false, если ID не найден
                throw new AppError('Клиент для удаления не найден', 404);
            }

            return true;
        } catch (error) {
            console.error(
                `Error in DeleteCustomerUseCase for ID ${customerId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error; // Пробрасываем AppError (403, 404, 400)
            }
            throw new AppError('Не удалось удалить клиента', 500);
        }
    }
}
