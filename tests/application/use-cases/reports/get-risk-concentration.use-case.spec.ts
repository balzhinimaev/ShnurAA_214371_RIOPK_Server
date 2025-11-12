// tests/application/use-cases/reports/get-risk-concentration.use-case.spec.ts
import { mock, MockProxy } from 'jest-mock-extended';
import { GetRiskConcentrationUseCase } from '../../../../src/application/use-cases/reports/get-risk-concentration.use-case';
import { IInvoiceRepository } from '../../../../src/domain/repositories/IInvoiceRepository';
import { RiskConcentrationDto } from '../../../../src/application/dtos/reports/risk-concentration.dto';

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

describe('GetRiskConcentrationUseCase', () => {
    let invoiceRepositoryMock: MockProxy<IInvoiceRepositoryExtended>;
    let getRiskConcentrationUseCase: GetRiskConcentrationUseCase;

    beforeEach(() => {
        invoiceRepositoryMock = mock<IInvoiceRepositoryExtended>();
        getRiskConcentrationUseCase = new GetRiskConcentrationUseCase(
            invoiceRepositoryMock,
        );
    });

    describe('execute', () => {
        it('should return empty result when no customers with debt', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue([]);

            // Act
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result.customers).toHaveLength(0);
            expect(result.summary.totalCustomers).toBe(0);
            expect(result.summary.totalDebt).toBe(0);
            expect(result.summary.asOfDate).toEqual(asOfDate);
            expect(result.summary.maxConcentration).toBe(0);
            expect(result.summary.top5Concentration).toBe(0);
            expect(result.summary.top10Concentration).toBe(0);
            expect(invoiceRepositoryMock.getAllCustomersWithDebt).toHaveBeenCalledWith(
                asOfDate,
            );
        });

        it('should calculate percentage of total correctly for each customer', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 1',
                    customerUnp: '123456789',
                    totalDebt: 50000, // 50% от 100000
                    overdueDebt: 30000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 2',
                    customerUnp: '987654321',
                    totalDebt: 30000, // 30% от 100000
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 3',
                    customerUnp: '111222333',
                    totalDebt: 20000, // 20% от 100000
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(RiskConcentrationDto);
            expect(result.customers).toHaveLength(3);

            // Проверяем проценты
            expect(result.customers[0].percentageOfTotal).toBeCloseTo(50, 2);
            expect(result.customers[1].percentageOfTotal).toBeCloseTo(30, 2);
            expect(result.customers[2].percentageOfTotal).toBeCloseTo(20, 2);

            // Проверяем summary
            expect(result.summary.totalCustomers).toBe(3);
            expect(result.summary.totalDebt).toBe(100000);
            expect(result.summary.asOfDate).toEqual(asOfDate);
            expect(result.summary.maxConcentration).toBeCloseTo(50, 2);
            expect(result.summary.top5Concentration).toBeCloseTo(100, 2); // Все 3 входят в топ-5
            expect(result.summary.top10Concentration).toBeCloseTo(100, 2); // Все 3 входят в топ-10
        });

        it('should use current date when asOfDate is not provided', async () => {
            // Arrange
            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue([]);

            // Act
            await getRiskConcentrationUseCase.execute({});

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

        it('should filter customers by minPercentage when provided', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 1',
                    customerUnp: '123456789',
                    totalDebt: 50000, // 50%
                    overdueDebt: 30000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 2',
                    customerUnp: '987654321',
                    totalDebt: 30000, // 30%
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 3',
                    customerUnp: '111222333',
                    totalDebt: 20000, // 20%
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act - фильтруем только контрагентов с процентом >= 30%
            const result = await getRiskConcentrationUseCase.execute({
                asOfDate,
                minPercentage: 30,
            });

            // Assert
            expect(result.customers).toHaveLength(2);
            expect(result.customers[0].customerId).toBe('customer-1');
            expect(result.customers[1].customerId).toBe('customer-2');
            expect(result.customers[0].percentageOfTotal).toBeCloseTo(50, 2);
            expect(result.customers[1].percentageOfTotal).toBeCloseTo(30, 2);
            
            // Метрики концентрации должны рассчитываться на основе ВСЕХ контрагентов
            expect(result.summary.totalCustomers).toBe(3);
            expect(result.summary.maxConcentration).toBeCloseTo(50, 2); // Максимальная концентрация из всех
            expect(result.summary.top5Concentration).toBeCloseTo(100, 2); // Все 3 входят в топ-5
            expect(result.summary.top10Concentration).toBeCloseTo(100, 2); // Все 3 входят в топ-10
        });

        it('should limit customers when limit is provided', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 1',
                    customerUnp: '123456789',
                    totalDebt: 50000,
                    overdueDebt: 30000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 2',
                    customerUnp: '987654321',
                    totalDebt: 30000,
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 3',
                    customerUnp: '111222333',
                    totalDebt: 20000,
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act - ограничиваем до 2 контрагентов
            const result = await getRiskConcentrationUseCase.execute({
                asOfDate,
                limit: 2,
            });

            // Assert
            expect(result.customers).toHaveLength(2);
            expect(result.customers[0].customerId).toBe('customer-1');
            expect(result.customers[1].customerId).toBe('customer-2');
            
            // Метрики концентрации должны рассчитываться на основе ВСЕХ контрагентов
            expect(result.summary.totalCustomers).toBe(3);
            expect(result.summary.maxConcentration).toBeCloseTo(50, 2);
            expect(result.summary.top5Concentration).toBeCloseTo(100, 2);
            expect(result.summary.top10Concentration).toBeCloseTo(100, 2);
        });

        it('should calculate concentration metrics correctly for top 5 and top 10', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            // Создаем 15 контрагентов для проверки метрик топ-5 и топ-10
            const mockCustomers = Array.from({ length: 15 }, (_, i) => ({
                customerId: `customer-${i + 1}`,
                customerName: `Customer ${i + 1}`,
                customerUnp: `12345678${i}`,
                totalDebt: 10000 - i * 100, // Убывающая задолженность
                overdueDebt: 5000,
                invoiceCount: 1,
                oldestDebtDays: 10,
            }));

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            expect(result.customers).toHaveLength(15);
            
            // Рассчитываем ожидаемые метрики
            const totalDebt = mockCustomers.reduce((sum, c) => sum + c.totalDebt, 0);
            const top5Debt = mockCustomers.slice(0, 5).reduce((sum, c) => sum + c.totalDebt, 0);
            const top10Debt = mockCustomers.slice(0, 10).reduce((sum, c) => sum + c.totalDebt, 0);
            const top5Percentage = (top5Debt / totalDebt) * 100;
            const top10Percentage = (top10Debt / totalDebt) * 100;
            const maxPercentage = (mockCustomers[0].totalDebt / totalDebt) * 100;

            expect(result.summary.maxConcentration).toBeCloseTo(maxPercentage, 2);
            expect(result.summary.top5Concentration).toBeCloseTo(top5Percentage, 2);
            expect(result.summary.top10Concentration).toBeCloseTo(top10Percentage, 2);
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
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            expect(result.customers).toHaveLength(1);
            expect(result.customers[0].percentageOfTotal).toBeCloseTo(100, 2);
            expect(result.summary.totalCustomers).toBe(1);
            expect(result.summary.totalDebt).toBe(100000);
            expect(result.summary.maxConcentration).toBeCloseTo(100, 2);
            expect(result.summary.top5Concentration).toBeCloseTo(100, 2);
            expect(result.summary.top10Concentration).toBeCloseTo(100, 2);
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
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            // Проверяем, что проценты округлены до 2 знаков
            expect(result.customers[0].percentageOfTotal).toBeCloseTo(33.33, 1);
            expect(result.customers[1].percentageOfTotal).toBeCloseTo(33.33, 1);
            // Третий может быть 33.33 или 33.34 из-за округления
            expect(result.customers[2].percentageOfTotal).toBeGreaterThanOrEqual(33.33);
            expect(result.customers[2].percentageOfTotal).toBeLessThanOrEqual(33.34);
            // Сумма должна быть близка к 100%
            const totalPercentage = result.customers.reduce(
                (sum, c) => sum + c.percentageOfTotal,
                0,
            );
            expect(totalPercentage).toBeCloseTo(100, 1);
        });

        it('should combine minPercentage and limit filters correctly', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            const mockCustomers = [
                {
                    customerId: 'customer-1',
                    customerName: 'Customer 1',
                    customerUnp: '123456789',
                    totalDebt: 50000, // 50%
                    overdueDebt: 30000,
                    invoiceCount: 5,
                    oldestDebtDays: 30,
                },
                {
                    customerId: 'customer-2',
                    customerName: 'Customer 2',
                    customerUnp: '987654321',
                    totalDebt: 30000, // 30%
                    overdueDebt: 20000,
                    invoiceCount: 3,
                    oldestDebtDays: 20,
                },
                {
                    customerId: 'customer-3',
                    customerName: 'Customer 3',
                    customerUnp: '111222333',
                    totalDebt: 20000, // 20%
                    overdueDebt: 10000,
                    invoiceCount: 2,
                    oldestDebtDays: 15,
                },
            ];

            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue(
                mockCustomers,
            );

            // Act - фильтруем >= 30% и ограничиваем до 1
            const result = await getRiskConcentrationUseCase.execute({
                asOfDate,
                minPercentage: 30,
                limit: 1,
            });

            // Assert
            expect(result.customers).toHaveLength(1);
            expect(result.customers[0].customerId).toBe('customer-1');
            expect(result.customers[0].percentageOfTotal).toBeCloseTo(50, 2);
            
            // Метрики концентрации должны рассчитываться на основе ВСЕХ контрагентов
            expect(result.summary.totalCustomers).toBe(3);
            expect(result.summary.maxConcentration).toBeCloseTo(50, 2);
            expect(result.summary.top5Concentration).toBeCloseTo(100, 2);
            expect(result.summary.top10Concentration).toBeCloseTo(100, 2);
        });

        it('should handle edge case: zero total debt', async () => {
            // Arrange
            const asOfDate = new Date('2024-01-01T00:00:00Z');
            // Хотя это маловероятно, но если все контрагенты имеют 0 задолженность
            // после фильтрации, репозиторий не должен их вернуть
            invoiceRepositoryMock.getAllCustomersWithDebt.mockResolvedValue([]);

            // Act
            const result = await getRiskConcentrationUseCase.execute({ asOfDate });

            // Assert
            expect(result.customers).toHaveLength(0);
            expect(result.summary.totalDebt).toBe(0);
            expect(result.summary.maxConcentration).toBe(0);
        });
    });
});

