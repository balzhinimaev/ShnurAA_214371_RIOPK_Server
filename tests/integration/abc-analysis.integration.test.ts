// tests/integration/abc-analysis.integration.test.ts
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
            '[abc-analysis.integration.test] Models obtained successfully.',
        );
    } catch (e) {
        console.error(
            '[abc-analysis.integration.test] Failed to get models:',
            e,
        );
        throw new Error('Could not obtain models for integration tests.');
    }
});

describe('ABC Analysis Integration Tests', () => {
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
            email: 'abc.test@example.com',
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

    describe('GET /api/v1/reports/abc-analysis', () => {
        it('should return empty groups when no customers with debt', async () => {
            const response = await request(app)
                .get('/api/v1/reports/abc-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('groupA');
            expect(response.body).toHaveProperty('groupB');
            expect(response.body).toHaveProperty('groupC');
            expect(response.body).toHaveProperty('summary');

            expect(response.body.groupA.customers).toHaveLength(0);
            expect(response.body.groupB.customers).toHaveLength(0);
            expect(response.body.groupC.customers).toHaveLength(0);
            expect(response.body.summary.totalCustomers).toBe(0);
            expect(response.body.summary.totalDebt).toBe(0);
        });

        it('should correctly categorize customers into groups A, B, C', async () => {
            // Создаем клиентов
            const customer1 = new CustomerModelTest({
                name: 'Customer A1',
                unp: '111111111',
                userId: testUserId,
            });
            await customer1.save();
            customerIds.push(customer1._id.toString());

            const customer2 = new CustomerModelTest({
                name: 'Customer A2',
                unp: '222222222',
                userId: testUserId,
            });
            await customer2.save();
            customerIds.push(customer2._id.toString());

            const customer3 = new CustomerModelTest({
                name: 'Customer B1',
                unp: '333333333',
                userId: testUserId,
            });
            await customer3.save();
            customerIds.push(customer3._id.toString());

            const customer4 = new CustomerModelTest({
                name: 'Customer C1',
                unp: '444444444',
                userId: testUserId,
            });
            await customer4.save();
            customerIds.push(customer4._id.toString());

            // Создаем счета для группировки:
            // Customer 1: 70000 (70% от 100000) - группа A
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerIds[0],
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 70000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            // Customer 2: 15000 (15% от 100000, накопительно 85%) - группа A
            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerIds[1],
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 15000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Customer 3: 10000 (10% от 100000, накопительно 95%) - группа B
            const invoice3 = new InvoiceModelTest({
                invoiceNumber: 'INV-003',
                customerId: customerIds[2],
                issueDate: new Date('2024-01-03'),
                dueDate: new Date('2024-02-02'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice3.save();

            // Customer 4: 5000 (5% от 100000, накопительно 100%) - группа C
            const invoice4 = new InvoiceModelTest({
                invoiceNumber: 'INV-004',
                customerId: customerIds[3],
                issueDate: new Date('2024-01-04'),
                dueDate: new Date('2024-02-03'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice4.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/abc-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('groupA');
            expect(response.body).toHaveProperty('groupB');
            expect(response.body).toHaveProperty('groupC');
            expect(response.body).toHaveProperty('summary');

            // Проверяем группу A (до 80% включительно)
            expect(response.body.groupA.group).toBe('A');
            expect(response.body.groupA.customers).toHaveLength(1);
            expect(response.body.groupA.customers[0].customerId).toBe(
                customerIds[0],
            );
            expect(response.body.groupA.totalDebt).toBe(70000);
            expect(response.body.groupA.percentageOfTotal).toBeCloseTo(70, 1);
            expect(response.body.groupA.customerCount).toBe(1);
            expect(response.body.groupA.percentageOfCustomers).toBeCloseTo(
                25,
                1,
            );

            // Проверяем группу B (от 80% до 95% включительно)
            expect(response.body.groupB.group).toBe('B');
            expect(response.body.groupB.customers).toHaveLength(2);
            expect(response.body.groupB.customers[0].customerId).toBe(
                customerIds[1],
            );
            expect(response.body.groupB.customers[1].customerId).toBe(
                customerIds[2],
            );
            expect(response.body.groupB.totalDebt).toBe(25000); // 15000 + 10000
            expect(response.body.groupB.percentageOfTotal).toBeCloseTo(25, 1);
            expect(response.body.groupB.customerCount).toBe(2);
            expect(response.body.groupB.percentageOfCustomers).toBeCloseTo(
                50,
                1,
            );

            // Проверяем группу C
            expect(response.body.groupC.group).toBe('C');
            expect(response.body.groupC.customers).toHaveLength(1);
            expect(response.body.groupC.totalDebt).toBe(5000);
            expect(response.body.groupC.percentageOfTotal).toBeCloseTo(5, 1);
            expect(response.body.groupC.customerCount).toBe(1);
            expect(response.body.groupC.percentageOfCustomers).toBeCloseTo(
                25,
                1,
            );

            // Проверяем summary
            expect(response.body.summary.totalCustomers).toBe(4);
            expect(response.body.summary.totalDebt).toBe(100000);

            // Проверяем накопительные проценты
            expect(
                response.body.groupA.customers[0].cumulativePercentage,
            ).toBeCloseTo(70, 1);
            expect(
                response.body.groupB.customers[0].cumulativePercentage,
            ).toBeCloseTo(85, 1);
            expect(
                response.body.groupB.customers[1].cumulativePercentage,
            ).toBeCloseTo(95, 1);
            expect(
                response.body.groupC.customers[0].cumulativePercentage,
            ).toBeCloseTo(100, 1);
        });

        it('should respect asOfDate parameter', async () => {
            const asOfDate = new Date('2024-01-10T00:00:00Z');
            const futureDate = new Date('2024-12-31T00:00:00Z');

            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '555555555',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счет с просрочкой на asOfDate, но не на futureDate
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
                    `/api/v1/reports/abc-analysis?asOfDate=${asOfDate.toISOString()}`,
                )
                .set('Authorization', `Bearer ${authToken}`);

            expect(response1.status).toBe(200);
            expect(response1.body.summary.totalCustomers).toBe(1);
            expect(response1.body.summary.totalDebt).toBe(10000);

            // Вызываем API с futureDate (счет должен быть оплачен)
            const response2 = await request(app)
                .get(
                    `/api/v1/reports/abc-analysis?asOfDate=${futureDate.toISOString()}`,
                )
                .set('Authorization', `Bearer ${authToken}`);

            expect(response2.status).toBe(200);
            // На futureDate счет все еще должен быть в анализе (он не оплачен)
            expect(response2.body.summary.totalCustomers).toBe(1);
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
                .get('/api/v1/reports/abc-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            // Должен быть только один контрагент с задолженностью 5000
            expect(response.body.summary.totalCustomers).toBe(1);
            expect(response.body.summary.totalDebt).toBe(5000);
            // Один контрагент с 100% должен быть в группе C
            expect(response.body.groupA.customers).toHaveLength(0);
            expect(response.body.groupB.customers).toHaveLength(0);
            expect(response.body.groupC.customers).toHaveLength(1);
            expect(response.body.groupC.customers[0].totalDebt).toBe(5000);
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
                .get('/api/v1/reports/abc-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.summary.totalCustomers).toBe(1);
            // Общая задолженность должна быть суммой всех счетов
            expect(response.body.summary.totalDebt).toBe(50000);
            // Один контрагент с 100% должен быть в группе C
            expect(response.body.groupA.customers).toHaveLength(0);
            expect(response.body.groupB.customers).toHaveLength(0);
            expect(response.body.groupC.customers).toHaveLength(1);
            expect(response.body.groupC.customers[0].totalDebt).toBe(50000);
            expect(response.body.groupC.customers[0].invoiceCount).toBe(2);
        });

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get(
                '/api/v1/reports/abc-analysis',
            );

            expect(response.status).toBe(401);
        });

        it('should handle single customer correctly', async () => {
            // Создаем одного клиента
            const customer = new CustomerModelTest({
                name: 'Single Customer',
                unp: '888888888',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счет
            const invoice = new InvoiceModelTest({
                invoiceNumber: 'INV-SINGLE',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 100000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/abc-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.summary.totalCustomers).toBe(1);
            // Один контрагент с 100% должен быть в группе C (так как 100 > 95)
            expect(response.body.groupA.customers).toHaveLength(0);
            expect(response.body.groupB.customers).toHaveLength(0);
            expect(response.body.groupC.customers).toHaveLength(1);
            expect(response.body.groupC.customers[0].cumulativePercentage).toBeCloseTo(
                100,
                1,
            );
        });
    });
});

