import { injectable, inject } from 'tsyringe';
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';
import { GetReceivablesDynamicsUseCase } from './get-receivables-dynamics.use-case';
import { GetReceivablesStructureUseCase } from './get-receivables-structure.use-case';

@injectable()
export class GetSummaryReportUseCase {
    constructor(
        @inject(GetDashboardSummaryUseCase) private getDashboardSummary: GetDashboardSummaryUseCase,
        @inject(GetReceivablesDynamicsUseCase) private getReceivablesDynamics: GetReceivablesDynamicsUseCase,
        @inject(GetReceivablesStructureUseCase) private getReceivablesStructure: GetReceivablesStructureUseCase,
    ) {}

    async execute() {
        const [summary, dynamics, structure] = await Promise.all([
            this.getDashboardSummary.execute(),
            this.getReceivablesDynamics.execute(),
            this.getReceivablesStructure.execute()
        ]);

        return {
            summary,
            dynamics,
            structure,
            generatedAt: new Date(),
        };
    }
}

