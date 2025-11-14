// src/application/use-cases/customers/get-debt-work-history.use-case.ts
import { injectable, inject } from 'tsyringe';
import {
    IDebtWorkRecordRepository,
    DebtWorkRecordRepositoryToken,
    FindDebtWorkRecordsOptions,
} from '../../../domain/repositories/IDebtWorkRecordRepository';
import { DebtWorkHistoryResponseDto, DebtWorkRecordDto, CustomerDebtWorkStatsDto } from '../../dtos/customers/debt-work-record.dto';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../../errors/AppError';
import { ICustomerRepository, CustomerRepositoryToken } from '../../../domain/repositories/ICustomerRepository';

@injectable()
export class GetDebtWorkHistoryUseCase {
    constructor(
        @inject(DebtWorkRecordRepositoryToken)
        private debtWorkRecordRepository: IDebtWorkRecordRepository,
        @inject(CustomerRepositoryToken)
        private customerRepository: ICustomerRepository,
    ) {}

    async execute(
        customerId: string,
        options: FindDebtWorkRecordsOptions = { customerId },
    ): Promise<DebtWorkHistoryResponseDto> {
        // Проверяем, что клиент существует
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new AppError('Клиент не найден', 404);
        }

        try {
            const { records, total } = await this.debtWorkRecordRepository.findByCustomerId(
                customerId,
                options,
            );
            const stats = await this.debtWorkRecordRepository.getCustomerStats(customerId);

            const recordDtos = records.map((record) =>
                plainToInstance(DebtWorkRecordDto, record, { excludeExtraneousValues: true }),
            );

            const statsDto = plainToInstance(CustomerDebtWorkStatsDto, stats, { excludeExtraneousValues: true });

            return plainToInstance(
                DebtWorkHistoryResponseDto,
                {
                    records: recordDtos,
                    stats: statsDto,
                    total,
                    offset: options.offset ?? 0,
                    limit: options.limit ?? 50,
                },
                { excludeExtraneousValues: true },
            );
        } catch (error) {
            console.error('[GetDebtWorkHistoryUseCase] Error:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Не удалось получить историю работы с задолженностью', 500);
        }
    }
}

