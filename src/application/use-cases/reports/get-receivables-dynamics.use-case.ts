import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';

export interface GetReceivablesDynamicsOptions {
    startDate?: Date;
    endDate?: Date;
}

@injectable()
export class GetReceivablesDynamicsUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepository,
    ) {}

    async execute(options: GetReceivablesDynamicsOptions = {}) {
        // По умолчанию за последние 12 месяцев
        const endDate = options.endDate || new Date();
        
        let startDate = options.startDate;
        if (!startDate) {
            startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 11); // 12 месяцев включая текущий
            startDate.setDate(1); // С первого числа
        }

        const dynamics = await this.invoiceRepository.getReceivablesDynamics(
            startDate,
            endDate,
        );

        return {
            dynamics,
            summary: {
                startPeriod: dynamics.length > 0 ? dynamics[0].period : null,
                endPeriod: dynamics.length > 0 ? dynamics[dynamics.length - 1].period : null,
                trend: this.calculateTrend(dynamics),
            }
        };
    }

    private calculateTrend(dynamics: { totalDebt: number }[]): string {
        if (dynamics.length < 2) return 'stable';
        
        const first = dynamics[0].totalDebt;
        const last = dynamics[dynamics.length - 1].totalDebt;
        
        if (first === 0) return last > 0 ? 'increasing' : 'stable';
        
        const change = (last - first) / first;
        
        if (change > 0.05) return 'increasing';
        if (change < -0.05) return 'decreasing';
        return 'stable';
    }
}

