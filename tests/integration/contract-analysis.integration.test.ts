// tests/integration/contract-analysis.integration.test.ts
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
            '[contract-analysis.integration.test] Models obtained successfully.',
        );
    } catch (e) {
        console.error(
            '[contract-analysis.integration.test] Failed to get models:',
            e,
        );
        throw new Error('Could not obtain models for integration tests.');
    }
});

describe('Contract Analysis Integration Tests', () => {
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
            email: 'contract.test@example.com',
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

    describe('GET /api/v1/reports/contract-analysis', () => {
        it('should return empty result when no invoices with debt', async () => {
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('contracts');
            expect(response.body).toHaveProperty('summary');

            expect(response.body.contracts).toHaveLength(0);
            expect(response.body.summary.totalContracts).toBe(0);
            expect(response.body.summary.totalDebt).toBe(0);
            expect(response.body.summary.totalOverdueDebt).toBe(0);
            expect(response.body.summary.totalInvoices).toBe(0);
        });

        it('should group invoices by contract number correctly', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '111111111',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счета по одному договору
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].contractNumber).toBe('CONTRACT-001');
            expect(response.body.contracts[0].customerId).toBe(customerId);
            expect(response.body.contracts[0].invoiceCount).toBe(2);
            expect(response.body.contracts[0].totalDebt).toBe(15000);
            expect(response.body.contracts[0].invoices).toHaveLength(2);
        });

        it('should separate invoices by different contract numbers', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '222222222',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счета по разным договорам
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(2);
            expect(response.body.summary.totalContracts).toBe(2);
            expect(response.body.summary.totalDebt).toBe(15000);
            expect(response.body.summary.totalInvoices).toBe(2);
        });

        it('should calculate overdue debt correctly', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '333333333',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            const asOfDate = new Date('2024-02-15T00:00:00Z');

            // Просроченный счет
            const overdueInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'), // Просрочен на asOfDate
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'CALL',
            });
            await overdueInvoice.save();

            // Не просроченный счет
            const currentInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerId,
                issueDate: new Date('2024-02-01'),
                dueDate: new Date('2024-03-01'), // Не просрочен
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await currentInvoice.save();

            // Вызываем API с asOfDate
            const response = await request(app)
                .get(
                    `/api/v1/reports/contract-analysis?asOfDate=${asOfDate.toISOString()}`,
                )
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].totalDebt).toBe(15000);
            expect(response.body.contracts[0].overdueDebt).toBe(10000);
            expect(response.body.contracts[0].currentDebt).toBe(5000);
            expect(response.body.contracts[0].overdueInvoiceCount).toBe(1);
            expect(response.body.summary.totalOverdueDebt).toBe(10000);
        });

        it('should exclude paid invoices by default', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '444444444',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Оплаченный счет
            const paidInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-PAID',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 10000, // Полностью оплачен
                paymentTermDays: 30,
                status: 'PAID',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'CLOSED',
            });
            await paidInvoice.save();

            // Неоплаченный счет
            const openInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-OPEN',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await openInvoice.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            // Должен быть один договор с одним неоплаченным счетом
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].invoiceCount).toBe(1);
            expect(response.body.contracts[0].invoices[0].invoiceNumber).toBe(
                'INV-OPEN',
            );
        });

        it('should filter by customerId when provided', async () => {
            // Создаем двух клиентов
            const customer1 = new CustomerModelTest({
                name: 'Customer 1',
                unp: '555555555',
                userId: testUserId,
            });
            await customer1.save();
            const customerId1 = customer1._id.toString();

            const customer2 = new CustomerModelTest({
                name: 'Customer 2',
                unp: '666666666',
                userId: testUserId,
            });
            await customer2.save();
            const customerId2 = customer2._id.toString();

            // Счета для первого клиента
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId1,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            // Счета для второго клиента
            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerId2,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Вызываем API с фильтром по первому клиенту
            const response = await request(app)
                .get(`/api/v1/reports/contract-analysis?customerId=${customerId1}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].customerId).toBe(customerId1);
            expect(response.body.contracts[0].contractNumber).toBe('CONTRACT-001');
        });

        it('should filter by contractNumber when provided', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '777777777',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Счета по разным договорам
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: customerId,
                issueDate: new Date('2024-01-02'),
                dueDate: new Date('2024-02-01'),
                totalAmount: 5000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-002',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            // Вызываем API с фильтром по договору
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis?contractNumber=CONTRACT-001')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].contractNumber).toBe('CONTRACT-001');
            expect(response.body.contracts[0].invoiceCount).toBe(1);
        });

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get(
                '/api/v1/reports/contract-analysis',
            );

            expect(response.status).toBe(401);
        });

        it('should include invoice details for each contract', async () => {
            // Создаем клиента
            const customer = new CustomerModelTest({
                name: 'Test Customer',
                unp: '888888888',
                userId: testUserId,
            });
            await customer.save();
            const customerId = customer._id.toString();

            // Создаем счет
            const invoice = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: customerId,
                issueDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                totalAmount: 10000,
                paidAmount: 2000,
                paymentTermDays: 30,
                status: 'OPEN',
                contractNumber: 'CONTRACT-001',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/contract-analysis')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contracts).toHaveLength(1);
            expect(response.body.contracts[0].invoices).toHaveLength(1);
            
            const invoiceDto = response.body.contracts[0].invoices[0];
            expect(invoiceDto.invoiceId).toBeDefined();
            expect(invoiceDto.invoiceNumber).toBe('INV-001');
            expect(invoiceDto.totalAmount).toBe(10000);
            expect(invoiceDto.paidAmount).toBe(2000);
            expect(invoiceDto.outstandingAmount).toBe(8000);
            expect(invoiceDto.status).toBe('OPEN');
        });
    });
});

