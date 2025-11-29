import { injectable, inject } from 'tsyringe';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../../domain/repositories/IInvoiceRepository';

@injectable()
export class GetReceivablesStructureUseCase {
    constructor(
        @inject(InvoiceRepositoryToken)
        private invoiceRepository: IInvoiceRepository,
    ) {}

    async execute(asOfDate: Date = new Date()) {
        return await this.invoiceRepository.getReceivablesStructure(asOfDate);
    }
}

