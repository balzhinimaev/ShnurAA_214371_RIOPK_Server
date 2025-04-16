// src/application/use-cases/customers/delete-customer.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../../domain/repositories/ICustomerRepository';
import { AppError } from '../../errors/AppError';
// TODO: Добавить проверку, что у клиента нет неоплаченных счетов перед удалением (потребует InvoiceRepository)
// import { IInvoiceRepository, InvoiceRepositoryToken } from '../../../domain/repositories/IInvoiceRepository';

@injectable()
export class DeleteCustomerUseCase {
    constructor(
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
        // TODO: Внедрить IInvoiceRepository для проверки счетов
        // @inject(InvoiceRepositoryToken) private invoiceRepository: IInvoiceRepository,
    ) {}

    /**
     * Удаляет клиента по ID, проверяя принадлежность пользователю.
     * @param customerId - ID клиента для удаления.
     * @param userId - ID пользователя, выполняющего операцию.
     * @returns true если клиент был удален, false если не найден или не принадлежит пользователю.
     * @throws {AppError} Если произошла ошибка БД.
     */
    async execute(customerId: string, userId: string): Promise<boolean> {
        // TODO: Перед удалением проверить, нет ли у клиента активных/неоплаченных счетов.
        // const openInvoices = await this.invoiceRepository.findOpenInvoicesByCustomerId(customerId);
        // if (openInvoices && openInvoices.length > 0) {
        //     throw new AppError('Нельзя удалить клиента, так как у него есть неоплаченные счета.', 400);
        // }

        try {
            // Вызываем метод репозитория для удаления, передавая оба ID
            const wasDeleted = await this.customerRepository.delete(
                customerId,
                userId,
            );
            return wasDeleted;
        } catch (error) {
            console.error(
                `Error in DeleteCustomerUseCase for ID ${customerId}, user ${userId}:`,
                error,
            );
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось удалить клиента', 500);
        }
    }
}
