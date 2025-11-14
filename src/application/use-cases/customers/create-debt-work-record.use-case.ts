// src/application/use-cases/customers/create-debt-work-record.use-case.ts
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

@injectable()
export class CreateDebtWorkRecordUseCase {
    constructor(
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    async execute(
        customerId: string,
        performedBy: string,
        data: CreateDebtWorkRecordData,
    ): Promise<DebtWorkRecordDto> {
        // Проверяем, что клиент существует
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new AppError('Клиент не найден', 404);
        }

        // Если указан invoiceId, проверяем что счет существует и принадлежит клиенту
        if (data.invoiceId) {
            // Здесь можно добавить проверку существования счета
            // Пока пропускаем, так как это опциональное поле
        }

        // Создаем объект данных, гарантируя что customerId и performedBy не перезаписываются
        const { customerId: _, performedBy: __, ...restData } = data;
        const createData: CreateDebtWorkRecordData = {
            customerId,
            performedBy,
            ...restData,
        };

        try {
            const record = await this.debtWorkRecordRepository.create(createData);
            return plainToInstance(DebtWorkRecordDto, record, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            console.error('[CreateDebtWorkRecordUseCase] Error:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось создать запись о работе с задолженностью', 500);
        }
    }
}

