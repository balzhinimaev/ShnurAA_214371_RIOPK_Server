// src/application/use-cases/customers/delete-debt-work-record.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { AppError } from '../../errors/AppError';
import { ICustomerRepository, CustomerRepositoryToken } from '../../../domain/repositories/ICustomerRepository';

@injectable()
export class DeleteDebtWorkRecordUseCase {
    constructor(
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    async execute(customerId: string, recordId: string): Promise<void> {
        // Проверяем, что клиент существует
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new AppError('Клиент не найден', 404);
        }

        // Проверяем, что запись существует
        const existingRecord = await this.debtWorkRecordRepository.findById(recordId);
        if (!existingRecord) {
            throw new AppError('Запись о работе с задолженностью не найдена', 404);
        }

        // Проверяем, что запись принадлежит указанному клиенту
        if (existingRecord.customerId !== customerId) {
            throw new AppError('Запись не принадлежит указанному клиенту', 403);
        }

        try {
            const deleted = await this.debtWorkRecordRepository.delete(recordId);
            
            if (!deleted) {
                throw new AppError('Не удалось удалить запись', 500);
            }

            console.log('[DeleteDebtWorkRecordUseCase] Record deleted:', {
                recordId,
                customerId,
            });
        } catch (error) {
            console.error('[DeleteDebtWorkRecordUseCase] Error:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось удалить запись о работе с задолженностью', 500);
        }
    }
}

