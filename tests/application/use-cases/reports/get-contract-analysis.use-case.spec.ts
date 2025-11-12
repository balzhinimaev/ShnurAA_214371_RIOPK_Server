// tests/application/use-cases/reports/get-contract-analysis.use-case.spec.ts
import { mock, MockProxy } from 'jest-mock-extended';
import { GetContractAnalysisUseCase } from '../../../../src/application/use-cases/reports/get-contract-analysis.use-case';
import { IInvoiceRepository } from '../../../../src/domain/repositories/IInvoiceRepository';
import { Invoice } from '../../../../src/domain/entities/invoice.entity';
import { Customer } from '../../../../src/domain/entities/customer.entity';
import { ContractAnalysisDto } from '../../../../src/application/dtos/reports/contract-analysis.dto';

// Расширенный интерфейс репозитория для мока
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getInvoicesByContract(
        asOfDate: Date,
        customerId?: string,
        contractNumber?: string,
    ): Promise<Invoice[]>;
}

describe('GetContractAnalysisUseCase', () => {
    let invoiceRepositoryMock: MockProxy<IInvoiceRepositoryExtended>;
    let getContractAnalysisUseCase: GetContractAnalysisUseCase;

    beforeEach(() => {
        invoiceRepositoryMock = mock<IInvoiceRepositoryExtended>();
        getContractAnalysisUseCase = new GetContractAnalysisUseCase(
            invoiceRepositoryMock,
        );
    });

    describe('execute', () => {
        it('should return empty result when no invoices with debt', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result.contracts).toHaveLength(0);
            expect(result.summary.totalContracts).toBe(0);
            expect(result.summary.totalDebt).toBe(0);
            expect(result.summary.totalOverdueDebt).toBe(0);
            expect(result.summary.totalInvoices).toBe(0);
            expect(result.summary.totalOverdueInvoices).toBe(0);
            expect(result.summary.asOfDate).toEqual(asOfDate);
        });

        it('should group invoices by contract number correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice2 = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
                invoice2,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ContractAnalysisDto);
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].contractNumber).toBe('CONTRACT-001');
            expect(result.contracts[0].customerId).toBe('customer-1');
            expect(result.contracts[0].customerName).toBe('Test Customer');
            expect(result.contracts[0].invoiceCount).toBe(2);
            expect(result.contracts[0].totalDebt).toBe(15000);
            expect(result.contracts[0].invoices).toHaveLength(2);
        });

        it('should group invoices without contract number by customer and service type', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                serviceType: 'PKT_SUPPORT',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice2 = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                serviceType: 'PKT_SUPPORT',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
                invoice2,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].contractNumber).toContain('Договор-customer-1');
            expect(result.contracts[0].serviceType).toBe('PKT_SUPPORT');
            expect(result.contracts[0].invoiceCount).toBe(2);
        });

        it('should calculate overdue debt correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-02-15T00:00:00Z'); // После сроков оплаты
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Просроченный счет
            const overdueInvoice = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'), // Просрочен на asOfDate
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Не просроченный счет
            const currentInvoice = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-02-01'),
                dueDate: new Date('2024-03-01'), // Не просрочен
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                overdueInvoice,
                currentInvoice,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].totalDebt).toBe(15000);
            expect(result.contracts[0].overdueDebt).toBe(10000);
            expect(result.contracts[0].currentDebt).toBe(5000);
            expect(result.contracts[0].overdueInvoiceCount).toBe(1);
            expect(result.contracts[0].oldestDebtDays).toBeGreaterThan(0);
        });

        it('should filter by customerId when provided', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer1 = new Customer({
                id: 'customer-1',
                name: 'Customer 1',
                unp: '111111111',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const customer2 = new Customer({
                id: 'customer-2',
                name: 'Customer 2',
                unp: '222222222',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer: customer1,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice2 = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-2',
                customer: customer2,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({
                asOfDate,
                customerId: 'customer-1',
            });

            // Assert
            expect(invoiceRepositoryMock.getInvoicesByContract).toHaveBeenCalledWith(
                asOfDate,
                'customer-1',
                undefined,
            );
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].customerId).toBe('customer-1');
        });

        it('should filter by contractNumber when provided', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({
                asOfDate,
                contractNumber: 'CONTRACT-001',
            });

            // Assert
            expect(invoiceRepositoryMock.getInvoicesByContract).toHaveBeenCalledWith(
                asOfDate,
                undefined,
                'CONTRACT-001',
            );
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].contractNumber).toBe('CONTRACT-001');
        });

        it('should exclude paid invoices by default', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const paidInvoice = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 10000, // Полностью оплачен
                paymentTermDays: 30,
                status: 'PAID',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const openInvoice = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Репозиторий возвращает все счета (включая оплаченные)
            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                paidInvoice,
                openInvoice,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            // Оплаченные должны быть отфильтрованы
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].invoiceCount).toBe(1);
            expect(result.contracts[0].invoices[0].invoiceId).toBe('invoice-2');
        });

        it('should include paid invoices when includePaid is true', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const paidInvoice = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 10000,
                paymentTermDays: 30,
                status: 'PAID',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                paidInvoice,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({
                asOfDate,
                includePaid: true,
            });

            // Assert
            expect(result.contracts).toHaveLength(1);
            expect(result.contracts[0].invoiceCount).toBe(1);
        });

        it('should calculate summary metrics correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-02-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'), // Просрочен
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice2 = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'), // Просрочен
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice3 = new Invoice({
                id: 'invoice-3',
                invoiceNumber: 'INV-003',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-02-01'),
                dueDate: new Date('2024-03-01'), // Не просрочен
                totalAmount: 3000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
                invoice2,
                invoice3,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result.summary.totalContracts).toBe(2);
            expect(result.summary.totalDebt).toBe(18000);
            expect(result.summary.totalOverdueDebt).toBe(15000);
            expect(result.summary.totalInvoices).toBe(3);
            expect(result.summary.totalOverdueInvoices).toBe(2);
        });

        it('should sort contracts by total debt descending', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-15T00:00:00Z');
            const customer = new Customer({
                id: 'customer-1',
                name: 'Test Customer',
                unp: '123456789',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice1 = new Invoice({
                id: 'invoice-1',
                invoiceNumber: 'INV-001',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002', // Меньшая сумма
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const invoice2 = new Invoice({
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                customerId: 'customer-1',
                customer,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001', // Большая сумма
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([
                invoice1,
                invoice2,
            ]);

            // Act
            const result = await getContractAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result.contracts).toHaveLength(2);
            // Договор с большей суммой должен быть первым
            expect(result.contracts[0].contractNumber).toBe('CONTRACT-001');
            expect(result.contracts[0].totalDebt).toBe(10000);
            expect(result.contracts[1].contractNumber).toBe('CONTRACT-002');
            expect(result.contracts[1].totalDebt).toBe(5000);
        });

        it('should use current date when asOfDate is not provided', async () => {
            // Arrange
            invoiceRepositoryMock.getInvoicesByContract.mockResolvedValue([]);

            // Act
            await getContractAnalysisUseCase.execute({});

            // Assert
            expect(invoiceRepositoryMock.getInvoicesByContract).toHaveBeenCalled();
            const callDate = invoiceRepositoryMock.getInvoicesByContract.mock
                .calls[0][0];
            expect(callDate).toBeInstanceOf(Date);
            // Проверяем, что дата близка к текущей (в пределах 1 секунды)
            const now = new Date();
            const diff = Math.abs(now.getTime() - callDate.getTime());
            expect(diff).toBeLessThan(1000);
        });
    });
});

