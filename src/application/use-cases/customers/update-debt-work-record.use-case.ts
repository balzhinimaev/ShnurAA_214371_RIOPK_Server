// src/application/use-cases/customers/update-debt-work-record.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
    CreateDebtWorkRecordData,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { DebtWorkRecordDto } from '../../dtos/customers/debt-work-record.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';
import { ICustomerRepository, CustomerRepositoryToken } from '../../../domain/repositories/ICustomerRepository';

export interface UpdateDebtWorkRecordData {
    invoiceId?: string;
    actionType?: string;
    actionDate?: Date;
    result?: string;
    description?: string;
    nextActionDate?: Date;
    amount?: number;
}

@injectable()
export class UpdateDebtWorkRecordUseCase {
    constructor(
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    async execute(
        customerId: string,
        recordId: string,
        data: UpdateDebtWorkRecordData,
    ): Promise<DebtWorkRecordDto> {
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
            // Формируем данные для обновления (только заполненные поля)
            const updateData: Partial<CreateDebtWorkRecordData> = {};
            
            if (data.invoiceId !== undefined) updateData.invoiceId = data.invoiceId;
            if (data.actionType !== undefined) updateData.actionType = data.actionType;
            if (data.actionDate !== undefined) updateData.actionDate = data.actionDate;
            if (data.result !== undefined) updateData.result = data.result;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.nextActionDate !== undefined) updateData.nextActionDate = data.nextActionDate;
            if (data.amount !== undefined) updateData.amount = data.amount;

            const updatedRecord = await this.debtWorkRecordRepository.update(recordId, updateData);
            
            if (!updatedRecord) {
                throw new AppError('Не удалось обновить запись', 500);
            }

            console.log('[UpdateDebtWorkRecordUseCase] Record updated:', {
                recordId,
                customerId,
                updatedFields: Object.keys(updateData),
            });

            return plainToInstance(DebtWorkRecordDto, updatedRecord, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            console.error('[UpdateDebtWorkRecordUseCase] Error:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось обновить запись о работе с задолженностью', 500);
        }
    }
}

