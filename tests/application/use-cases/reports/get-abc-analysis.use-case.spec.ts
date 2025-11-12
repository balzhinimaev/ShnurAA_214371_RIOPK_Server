// tests/application/use-cases/reports/get-abc-analysis.use-case.spec.ts
import { mock, MockProxy } from 'jest-mock-extended';
import { GetAbcAnalysisUseCase } from '../../../../src/application/use-cases/reports/get-abc-analysis.use-case';
import { IInvoiceRepository } from '../../../../src/domain/repositories/IInvoiceRepository';
import { AbcAnalysisDto } from '../../../../src/application/dtos/reports/abc-analysis.dto';

// Расширенный интерфейс репозитория для мока
interface IInvoiceRepositoryExtended extends IInvoiceRepository {
    getAllCustomersWithDebt(asOfDate: Date): Promise<
        Array<{
            customerId: string;
            customerName: string;
            customerUnp?: string;
            totalDebt: number;
            overdueDebt: number;
            invoiceCount: number;
            oldestDebtDays: number;
        }>
    >;
}

describe('GetAbcAnalysisUseCase', () => {
    let invoiceRepositoryMock: MockProxy<IInvoiceRepositoryExtended>;
    let getAbcAnalysisUseCase: GetAbcAnalysisUseCase;

    beforeEach(() => {
        invoiceRepositoryMock = mock<IInvoiceRepositoryExtended>();
        getAbcAnalysisUseCase = new GetAbcAnalysisUseCase(invoiceRepositoryMock);
    });

    describe('execute', () => {
        it('should return empty groups when no customers with debt', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue([]);

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result.groupA.customers).toHaveLength(0);
            expect(result.groupB.customers).toHaveLength(0);
            expect(result.groupC.customers).toHaveLength(0);
            expect(result.summary.totalCustomers).toBe(0);
            expect(result.summary.totalDebt).toBe(0);
            expect(result.summary.asOfDate).toEqual(asOfDate);
            expect(invoiceRepositoryMock.getAllCustomersWithDebt).toHaveBeenCalledWith(
                asOfDate,
            );
        });

        it('should correctly categorize customers into groups A, B, C based on cumulative percentage', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            // Создаем тестовые данные:
            // - 1 контрагент с 70% задолженности (группа A, накопительно 70%)
            // - 1 контрагент с 15% задолженности (группа B, накопительно 85%)
            // - 1 контрагент с 10% задолженности (группа B, накопительно 95%)
            // - 1 контрагент с 5% задолженности (группа C, накопительно 100%)
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer A1',
                    customerUnp: '123456789',
                    totalDebt: 70000, // 70% от 100000
                    overdueDebt: 50000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer A2',
                    customerUnp: '987654321',
                    totalDebt: 15000, // 15% от 100000
                    overdueDebt: 10000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer B1',
                    customerUnp: '111222333',
                    totalDebt: 10000, // 10% от 100000
                    overdueDebt: 8000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
                {
                    customerId: 'customer-4',
                    customerName: 'Customer C1',
                    customerUnp: '444555666',
                    totalDebt: 5000, // 5% от 100000
                    overdueDebt: 3000,
                    invoiceCount: 1,
                    oldestDebtDays: 10,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(AbcAnalysisDto);

            // Проверяем группу A (до 80% включительно)
            expect(result.groupA.group).toBe('A');
            expect(result.groupA.customers).toHaveLength(1);
            expect(result.groupA.customers[0].customerId).toBe('customer-1');
            expect(result.groupA.totalDebt).toBe(70000);
            expect(result.groupA.percentageOfTotal).toBeCloseTo(70, 2);
            expect(result.groupA.customerCount).toBe(1);
            expect(result.groupA.percentageOfCustomers).toBeCloseTo(25, 2); // 1 из 4

            // Проверяем группу B (от 80% до 95% включительно)
            expect(result.groupB.group).toBe('B');
            expect(result.groupB.customers).toHaveLength(2);
            expect(result.groupB.customers[0].customerId).toBe('customer-2');
            expect(result.groupB.customers[1].customerId).toBe('customer-3');
            expect(result.groupB.totalDebt).toBe(25000); // 15000 + 10000
            expect(result.groupB.percentageOfTotal).toBeCloseTo(25, 2);
            expect(result.groupB.customerCount).toBe(2);
            expect(result.groupB.percentageOfCustomers).toBeCloseTo(50, 2); // 2 из 4

            // Проверяем группу C (от 95% до 100%)
            expect(result.groupC.group).toBe('C');
            expect(result.groupC.customers).toHaveLength(1);
            expect(result.groupC.customers[0].customerId).toBe('customer-4');
            expect(result.groupC.totalDebt).toBe(5000);
            expect(result.groupC.percentageOfTotal).toBeCloseTo(5, 2);
            expect(result.groupC.customerCount).toBe(1);
            expect(result.groupC.percentageOfCustomers).toBeCloseTo(25, 2); // 1 из 4

            // Проверяем summary
            expect(result.summary.totalCustomers).toBe(4);
            expect(result.summary.totalDebt).toBe(100000);
            expect(result.summary.asOfDate).toEqual(asOfDate);

            // Проверяем накопительные проценты
            expect(result.groupA.customers[0].cumulativePercentage).toBeCloseTo(
                70,
                2,
            );
            expect(result.groupB.customers[0].cumulativePercentage).toBeCloseTo(
                85,
                2,
            );
            expect(result.groupB.customers[1].cumulativePercentage).toBeCloseTo(
                95,
                2,
            );
            expect(result.groupC.customers[0].cumulativePercentage).toBeCloseTo(
                100,
                2,
            );
        });

        it('should use current date when asOfDate is not provided', async () => {
            // Arrange
            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue([]);

            // Act
            await getAbcAnalysisUseCase.execute({});

            // Assert
            expect(invoiceRepositoryMock.getAllCustomersWithDebt).toHaveBeenCalled();
            const callDate = invoiceRepositoryMock.getAllCustomersWithDebt.mock
                .calls[0][0];
            expect(callDate).toBeInstanceOf(Date);
            // Проверяем, что дата близка к текущей (в пределах 1 секунды)
            const now = new Date();
            const diff = Math.abs(now.getTime() - callDate.getTime());
            expect(diff).toBeLessThan(1000);
        });

        it('should handle single customer correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Single Customer',
                    customerUnp: '123456789',
                    totalDebt: 100000,
                    overdueDebt: 50000,
                    invoiceCount: 10,
                    oldestDebtDays: 30,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            // Один контрагент с 100% должен попасть в группу C (так как 100 > 95)
            expect(result.groupA.customers).toHaveLength(0);
            expect(result.groupB.customers).toHaveLength(0);
            expect(result.groupC.customers).toHaveLength(1);
            expect(result.groupC.customers[0].cumulativePercentage).toBeCloseTo(
                100,
                2,
            );
            expect(result.groupC.totalDebt).toBe(100000);
            expect(result.groupC.percentageOfTotal).toBeCloseTo(100, 2);
        });

        it('should handle edge case: customer exactly at 80% threshold', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 80%',
                    customerUnp: '123456789',
                    totalDebt: 80000, // Ровно 80%
                    overdueDebt: 40000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 20%',
                    customerUnp: '987654321',
                    totalDebt: 20000, // 20%
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            // Первый контрагент должен быть в группе A (<= 80%)
            expect(result.groupA.customers).toHaveLength(1);
            expect(result.groupA.customers[0].customerId).toBe('customer-1');
            expect(result.groupA.customers[0].cumulativePercentage).toBeCloseTo(
                80,
                2,
            );
            // Второй контрагент должен быть в группе C (100% > 95%)
            expect(result.groupB.customers).toHaveLength(0);
            expect(result.groupC.customers).toHaveLength(1);
            expect(result.groupC.customers[0].customerId).toBe('customer-2');
            expect(result.groupC.customers[0].cumulativePercentage).toBeCloseTo(
                100,
                2,
            );
        });

        it('should handle edge case: customer exactly at 95% threshold', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 80%',
                    customerUnp: '123456789',
                    totalDebt: 80000, // 80%
                    overdueDebt: 40000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 15%',
                    customerUnp: '987654321',
                    totalDebt: 15000, // 15%, накопительно 95%
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 5%',
                    customerUnp: '111222333',
                    totalDebt: 5000, // 5%
                    overdueDebt: 3000,
                    invoiceCount: 1,
                    oldestDebtDays: 10,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            // Первый контрагент в группе A
            expect(result.groupA.customers).toHaveLength(1);
            expect(result.groupA.customers[0].customerId).toBe('customer-1');
            // Второй контрагент должен быть в группе B (<= 95%)
            expect(result.groupB.customers).toHaveLength(1);
            expect(result.groupB.customers[0].customerId).toBe('customer-2');
            // Третий контрагент должен быть в группе C (> 95%)
            expect(result.groupC.customers).toHaveLength(1);
            expect(result.groupC.customers[0].customerId).toBe('customer-3');
        });

        it('should round percentages correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 1',
                    customerUnp: '123456789',
                    totalDebt: 33333.333, // 33.333% от 100000
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 2',
                    customerUnp: '987654321',
                    totalDebt: 33333.333, // 33.333%
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 3',
                    customerUnp: '111222333',
                    totalDebt: 33333.334, // 33.334%
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getAbcAnalysisUseCase.execute({ asOfDate });

            // Assert
            // Проверяем, что проценты округлены до 2 знаков
            // Первые два контрагента по 33.33% каждый (накопительно 66.66%) - группа A
            // Третий контрагент 33.34% (накопительно 100%) - группа C (так как 100 > 95)
            expect(result.groupA.customers).toHaveLength(2);
            expect(result.groupB.customers).toHaveLength(0);
            expect(result.groupC.customers).toHaveLength(1);
            expect(result.groupA.percentageOfTotal).toBeCloseTo(66.67, 2);
            expect(result.groupC.percentageOfTotal).toBeCloseTo(33.33, 2);
            // Проверяем, что накопительные проценты округлены
            expect(
                result.groupA.customers[0].cumulativePercentage,
            ).toBeCloseTo(33.33, 2);
            expect(
                result.groupA.customers[1].cumulativePercentage,
            ).toBeCloseTo(66.67, 2);
            expect(
                result.groupC.customers[0].cumulativePercentage,
            ).toBeCloseTo(100, 2);
        });
    });
});

