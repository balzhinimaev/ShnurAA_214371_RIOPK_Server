// tests/integration/risk-concentration.integration.test.ts
import 'reflect-metadata';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../src/infrastructure/config';

import app from '../../src/infrastructure/web/express/app';
import { clearDatabase } from '../helpers/integration-test-setup';
import { testConnection } from '../jest.setup';

// Модели для прямых проверок БД
let UserModelTest: mongoose.Model<any>;
let CustomerModelTest: mongoose.Model<any>;
let InvoiceModelTest: mongoose.Model<any>;

beforeAll(async () => {
    if (!testConnection) {
        throw new Error(
            'Global test connection is not available. Check jest.setup.ts.',
        );
    }
    try {
        // Регистрируем модели
        if (testConnection.models['User']) {
            UserModelTest = testConnection.model('User');
        } else {
            const { UserSchema } = await import(
                '../../src/infrastructure/database/mongoose/schemas/user.schema'
            );
            UserModelTest = testConnection.model('User', UserSchema);
        }

        if (testConnection.models['Customer']) {
            CustomerModelTest = testConnection.model('Customer');
        } else {
            const { CustomerModel } = await import(
                '../../src/infrastructure/database/mongoose/schemas/customer.schema'
            );
            CustomerModelTest = testConnection.model(
                'Customer',
                CustomerModel.schema,
            );
        }

        if (testConnection.models['Invoice']) {
            InvoiceModelTest = testConnection.model('Invoice');
        } else {
            const { InvoiceSchema } = await import(
                '../../src/infrastructure/database/mongoose/schemas/invoice.schema'
            );
            InvoiceModelTest = testConnection.model('Invoice', InvoiceSchema);
        }

        // Переопределяем InvoiceModel в модуле для использования тестового подключения
        const invoiceSchemaModule = await import(
            '../../src/infrastructure/database/mongoose/schemas/invoice.schema'
        );
        // @ts-ignore - временное решение для тестов
        invoiceSchemaModule.InvoiceModel = InvoiceModelTest;

        console.log(
            '[risk-concentration.integration.test] Models obtained successfully.',
        );
    } catch (e) {
        console.error(
            '[risk-concentration.integration.test] Failed to get models:',
            e,
        );
        throw new Error('Could not obtain models for integration tests.');
    }
});

describe('Risk Concentration Integration Tests', () => {
    let authToken: string;
    let testUserId: string;
    let customerIds: string[] = [];

    // Создаем тестового пользователя и получаем токен
    beforeAll(async () => {
        if (!testConnection) {
            throw new Error('Test connection is not available');
        }
        await clearDatabase(testConnection);

        // Создаем тестового пользователя
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const testUser = new UserModelTest({
            name: 'Test User',
            email: 'risk.test@example.com',
            passwordHash,
            roles: ['ADMIN'],
        });
        await testUser.save();
        testUserId = testUser._id.toString();

        // Создаем токен
        const payload = {
            sub: testUserId,
            roles: testUser.roles || ['ADMIN'],
        };
        // @ts-ignore - типы jwt могут конфликтовать с конфигом
        authToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
            algorithm: 'HS256',
        });
    });

    beforeEach(async () => {
        if (!testConnection) return;
        // Очищаем данные перед каждым тестом
        await InvoiceModelTest.deleteMany({});
        await CustomerModelTest.deleteMany({});
        customerIds = [];
    });

    describe('GET /api/v1/reports/risk-concentration', () => {
        it('should return empty result when no customers with debt', async () => {
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('customers');
            expect(response.body).toHaveProperty('summary');

            expect(response.body.customers).toHaveLength(0);
            expect(response.body.summary.totalCustomers).toBe(0);
            expect(response.body.summary.totalDebt).toBe(0);
            expect(response.body.summary.maxConcentration).toBe(0);
            expect(response.body.summary.top5Concentration).toBe(0);
            expect(response.body.summary.top10Concentration).toBe(0);
        });

        it('should calculate percentage of total correctly for each customer', async () => {
            // Создаем клиентов
            const customer1 = new CustomerModelTest({
                name: 'Customer 1',
                unp: '111111111',
                userId: testUserId,
            });
            await customer1.save();
            customerIds.push(customer1._id.toString());

            const customer2 = new CustomerModelTest({
                name: 'Customer 2',
                unp: '222222222',
                userId: testUserId,
            });
            await customer2.save();
            customerIds.push(customer2._id.toString());

            const customer3 = new CustomerModelTest({
                name: 'Customer 3',
                unp: '333333333',
                userId: testUserId,
            });
            await customer3.save();
            customerIds.push(customer3._id.toString());

            // Создаем счета:
            // Customer 1: 50000 (50% от 100000)
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerIds[0],
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 50000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            // Customer 2: 30000 (30% от 100000)
            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerIds[1],
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 30000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Customer 3: 20000 (20% от 100000)
            const invoice3 = new InvoiceModelTest({
                invoiceNumber: 'INV-003',
                customerId: customerIds[2],
                issueDate: new Date('2024-01-03'),
                dueDate: new Date('2024-02-02'),
                totalAmount: 20000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice3.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.customers).toHaveLength(3);

            // Проверяем проценты
            expect(response.body.customers[0].percentageOfTotal).toBeCloseTo(50, 1);
            expect(response.body.customers[1].percentageOfTotal).toBeCloseTo(30, 1);
            expect(response.body.customers[2].percentageOfTotal).toBeCloseTo(20, 1);

            // Проверяем summary
            expect(response.body.summary.totalCustomers).toBe(3);
            expect(response.body.summary.totalDebt).toBe(100000);
            expect(response.body.summary.maxConcentration).toBeCloseTo(50, 1);
            expect(response.body.summary.top5Concentration).toBeCloseTo(100, 1);
            expect(response.body.summary.top10Concentration).toBeCloseTo(100, 1);
        });

        it('should respect asOfDate parameter', async () => {
            const asOfDate = new Date('2024-01-10T00:00:00Z');

            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '555555555',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счет с просрочкой на asOfDate
            const invoice = new InvoiceModelTest({
                invoiceNumber: 'INV-005',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-05'), // Просрочен на asOfDate
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice.save();

            // Вызываем API с asOfDate
            const response1 = await request(app)
                .get(
                    `/api/v1/reports/risk-concentration?asOfDate=${asOfDate.toISOString()}`,
                )
                .set('Authorization', `Bearer ${authToken}`);

            expect(response1.status).toBe(200);
            expect(response1.body.summary.totalCustomers).toBe(1);
            expect(response1.body.summary.totalDebt).toBe(10000);
        });

        it('should exclude paid invoices from analysis', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '666666666',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем оплаченный счет
            const paidInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-PAID',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 10000, // Полностью оплачен
                paymentTermDays: 30,
                status: 'PAID',
                debtWorkStatus: 'CLOSED',
            });
            await paidInvoice.save();

            // Создаем неоплаченный счет
            const openInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-OPEN',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await openInvoice.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            // Должен быть только один контрагент с задолженностью 5000
            expect(response.body.summary.totalCustomers).toBe(1);
            expect(response.body.summary.totalDebt).toBe(5000);
            expect(response.body.customers[0].totalDebt).toBe(5000);
            expect(response.body.customers[0].percentageOfTotal).toBeCloseTo(100, 1);
        });

        it('should handle customers with multiple invoices', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Multi Invoice Customer',
                unp: '777777777',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем несколько счетов для одного клиента
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-M1',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 30000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-M2',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 20000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.summary.totalCustomers).toBe(1);
            // Общая задолженность должна быть суммой всех счетов
            expect(response.body.summary.totalDebt).toBe(50000);
            expect(response.body.customers[0].totalDebt).toBe(50000);
            expect(response.body.customers[0].invoiceCount).toBe(2);
            expect(response.body.customers[0].percentageOfTotal).toBeCloseTo(100, 1);
        });

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get(
                '/api/v1/reports/risk-concentration',
            );

            expect(response.status).toBe(401);
        });

        it('should filter by minPercentage when provided', async () => {
            // Создаем клиентов
            const customer1 = new CustomerModelTest({
                name: 'Customer 1',
                unp: '888888888',
                userId: testUserId,
            });
            await customer1.save();
            customerIds.push(customer1._id.toString());

            const customer2 = new CustomerModelTest({
                name: 'Customer 2',
                unp: '999999999',
                userId: testUserId,
            });
            await customer2.save();
            customerIds.push(customer2._id.toString());

            const customer3 = new CustomerModelTest({
                name: 'Customer 3',
                unp: '101010101',
                userId: testUserId,
            });
            await customer3.save();
            customerIds.push(customer3._id.toString());

            // Создаем счета: 50%, 30%, 20%
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-F1',
                customerId: customerIds[0],
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 50000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-F2',
                customerId: customerIds[1],
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 30000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            const invoice3 = new InvoiceModelTest({
                invoiceNumber: 'INV-F3',
                customerId: customerIds[2],
                issueDate: new Date('2024-01-03'),
                dueDate: new Date('2024-02-02'),
                totalAmount: 20000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice3.save();

            // Вызываем API с фильтром minPercentage >= 30%
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration?minPercentage=30')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.customers).toHaveLength(2);
            expect(response.body.customers[0].percentageOfTotal).toBeCloseTo(50, 1);
            expect(response.body.customers[1].percentageOfTotal).toBeCloseTo(30, 1);
            
            // Метрики концентрации должны рассчитываться на основе ВСЕХ контрагентов
            expect(response.body.summary.totalCustomers).toBe(3);
            expect(response.body.summary.totalDebt).toBe(100000);
            expect(response.body.summary.maxConcentration).toBeCloseTo(50, 1);
            expect(response.body.summary.top5Concentration).toBeCloseTo(100, 1);
            expect(response.body.summary.top10Concentration).toBeCloseTo(100, 1);
        });

        it('should limit results when limit parameter is provided', async () => {
            // Создаем несколько клиентов
            for (let i = 0; i < 5; i++) {
                const customer = new CustomerModelTest({
                    name: `Customer ${i + 1}`,
                    unp: `11111111${i}`,
                    userId: testUserId,
                });
                await customer.save();
                customerIds.push(customer._id.toString());

                const invoice = new InvoiceModelTest({
                    invoiceNumber: `INV-L${i + 1}`,
                    customerId: customer._id.toString(),
                    issueDate: new Date('2024-01-01'),
                    dueDate: new Date('2024-01-31'),
                    totalAmount: 10000,
                    paidAmount: 0,
                    paymentTermDays: 30,
                    status: 'OPEN',
                    debtWorkStatus: 'IN_TIME',
                });
                await invoice.save();
            }

            // Вызываем API с limit=3
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration?limit=3')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.customers).toHaveLength(3);
            // Summary должен показывать общее количество контрагентов (5), а не ограниченное
            expect(response.body.summary.totalCustomers).toBe(5);
            expect(response.body.summary.totalDebt).toBe(50000);
            // Метрики концентрации должны рассчитываться на основе ВСЕХ контрагентов
            // Все 5 контрагентов имеют одинаковую задолженность (20% каждый)
            expect(response.body.summary.maxConcentration).toBeCloseTo(20, 1);
            expect(response.body.summary.top5Concentration).toBeCloseTo(100, 1);
            expect(response.body.summary.top10Concentration).toBeCloseTo(100, 1);
        });

        it('should calculate concentration metrics correctly', async () => {
            // Создаем 10 клиентов с разной задолженностью
            const debts: number[] = [];
            for (let i = 0; i < 10; i++) {
                const debt = 10000 - i * 100; // Убывающая задолженность
                debts.push(debt);
                
                const customer = new CustomerModelTest({
                    name: `Customer ${i + 1}`,
                    unp: `22222222${i}`,
                    userId: testUserId,
                });
                await customer.save();
                customerIds.push(customer._id.toString());

                const invoice = new InvoiceModelTest({
                    invoiceNumber: `INV-C${i + 1}`,
                    customerId: customer._id.toString(),
                    issueDate: new Date('2024-01-01'),
                    dueDate: new Date('2024-01-31'),
                    totalAmount: debt,
                    paidAmount: 0,
                    paymentTermDays: 30,
                    status: 'OPEN',
                    debtWorkStatus: 'IN_TIME',
                });
                await invoice.save();
            }

            // Рассчитываем ожидаемые метрики
            const totalDebt = debts.reduce((sum, d) => sum + d, 0);
            const top5Debt = debts.slice(0, 5).reduce((sum, d) => sum + d, 0);
            const top10Debt = debts.reduce((sum, d) => sum + d, 0); // Все 10
            const maxPercentage = (debts[0] / totalDebt) * 100;
            const top5Percentage = (top5Debt / totalDebt) * 100;
            const top10Percentage = (top10Debt / totalDebt) * 100;

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/risk-concentration')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.summary.totalCustomers).toBe(10);
            expect(response.body.summary.totalDebt).toBe(totalDebt);
            
            // Проверяем точные значения метрик
            expect(response.body.summary.maxConcentration).toBeCloseTo(maxPercentage, 1);
            expect(response.body.summary.top5Concentration).toBeCloseTo(top5Percentage, 1);
            expect(response.body.summary.top10Concentration).toBeCloseTo(top10Percentage, 1);
            
            // Топ-5 должна быть больше максимальной концентрации
            expect(response.body.summary.top5Concentration).toBeGreaterThan(
                response.body.summary.maxConcentration,
            );
            
            // Топ-10 должна быть равна 100% (все контрагенты)
            expect(response.body.summary.top10Concentration).toBeCloseTo(100, 1);
        });
    });
});

