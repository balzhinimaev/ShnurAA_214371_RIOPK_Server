// tests/integration/turnover-metrics.integration.test.ts
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
            // Используем схему из существующей модели
            CustomerModelTest = testConnection.model('Customer', CustomerModel.schema);
        }

        // Регистрируем InvoiceModel на тестовом подключении
        // Это важно, чтобы репозиторий использовал правильное подключение
        if (testConnection.models['Invoice']) {
            InvoiceModelTest = testConnection.model('Invoice');
        } else {
            const { InvoiceSchema } = await import(
                '../../src/infrastructure/database/mongoose/schemas/invoice.schema'
            );
            // Создаем модель на тестовом подключении
            InvoiceModelTest = testConnection.model('Invoice', InvoiceSchema);
        }
        
        // Переопределяем InvoiceModel в модуле для использования тестового подключения
        // Это нужно, чтобы MongoInvoiceRepository использовал правильное подключение
        const invoiceSchemaModule = await import(
            '../../src/infrastructure/database/mongoose/schemas/invoice.schema'
        );
        // Заменяем InvoiceModel на модель с тестового подключения
        // @ts-ignore - временное решение для тестов
        invoiceSchemaModule.InvoiceModel = InvoiceModelTest;

        console.log(
            '[turnover-metrics.integration.test] Models obtained successfully.',
        );
    } catch (e) {
        console.error(
            '[turnover-metrics.integration.test] Failed to get models:',
            e,
        );
        throw new Error('Could not obtain models for integration tests.');
    }
});

describe('Turnover Metrics Integration Tests', () => {
    let authToken: string;
    let testUserId: string;
    let testCustomerId: string;

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
            email: 'turnover.test@example.com',
            passwordHash,
            roles: ['ADMIN'], // roles должен быть массивом
        });
        await testUser.save();
        testUserId = testUser._id.toString();

        // Создаем токен с правильной структурой (sub и roles, как ожидает authMiddleware)
        const payload = { 
            sub: testUserId, 
            roles: testUser.roles || ['ADMIN'] // Используем roles из пользователя
        };
        // @ts-ignore - типы jwt могут конфликтовать с конфигом
        authToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
            algorithm: 'HS256',
        });

        // Создаем тестового клиента
        const testCustomer = new CustomerModelTest({
            name: 'Test Customer',
            unp: '123456789',
            userId: testUserId,
        });
        await testCustomer.save();
        testCustomerId = testCustomer._id.toString();
    });

    beforeEach(async () => {
        if (!testConnection) return;
        // Очищаем только счета перед каждым тестом
        await InvoiceModelTest.deleteMany({});
    });

    describe('GET /api/v1/reports/dashboard/summary - Turnover Metrics', () => {
        it('should calculate turnover metrics correctly with invoices from previous and current month', async () => {
            const now = new Date();
            const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );
            const previousMonthEnd = new Date(currentMonthStart);
            previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

            // Создаем счета из предыдущего месяца (неоплаченные остатки)
            // ДЗ на начало периода = 100000 (3 счета по 50000, 30000, 20000)
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-001',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 дней назад от начала месяца
                dueDate: new Date(previousMonthEnd.getTime() + 20 * 24 * 60 * 60 * 1000),
                totalAmount: 50000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const invoice2 = new InvoiceModelTest({
                invoiceNumber: 'INV-002',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 5 * 24 * 60 * 60 * 1000),
                dueDate: new Date(previousMonthEnd.getTime() + 25 * 24 * 60 * 60 * 1000),
                totalAmount: 30000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice2.save();

            const invoice3 = new InvoiceModelTest({
                invoiceNumber: 'INV-003',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 2 * 24 * 60 * 60 * 1000),
                dueDate: new Date(previousMonthEnd.getTime() + 28 * 24 * 60 * 60 * 1000),
                totalAmount: 20000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice3.save();

            // Создаем счета в текущем месяце (выручка за период)
            // Выручка за период = 150000 (3 счета по 60000, 50000, 40000)
            const invoice4 = new InvoiceModelTest({
                invoiceNumber: 'INV-004',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 дня после начала месяца
                dueDate: new Date(currentMonthStart.getTime() + 32 * 24 * 60 * 60 * 1000),
                totalAmount: 60000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice4.save();

            const invoice5 = new InvoiceModelTest({
                invoiceNumber: 'INV-005',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 5 * 24 * 60 * 60 * 1000),
                dueDate: new Date(currentMonthStart.getTime() + 35 * 24 * 60 * 60 * 1000),
                totalAmount: 50000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice5.save();

            const invoice6 = new InvoiceModelTest({
                invoiceNumber: 'INV-006',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 10 * 24 * 60 * 60 * 1000),
                dueDate: new Date(currentMonthStart.getTime() + 40 * 24 * 60 * 60 * 1000),
                totalAmount: 40000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice6.save();

            // Вызываем API
            const response = await request(app)
                .get('/api/v1/reports/dashboard/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('averageReceivables');
            expect(response.body).toHaveProperty('turnoverRatio');
            expect(response.body).toHaveProperty('periodRevenue');

            // Проверяем расчеты
            // ДЗ на начало = 100000 (50000 + 30000 + 20000)
            // ДЗ на конец = 250000 (100000 + 150000)
            // Средняя ДЗ = (100000 + 250000) / 2 = 175000
            // Выручка за период = 150000 (60000 + 50000 + 40000)
            // Оборачиваемость = 150000 / 175000 ≈ 0.86

            expect(response.body.periodRevenue).toBe(150000);
            expect(response.body.averageReceivables).toBe(175000);
            expect(response.body.turnoverRatio).toBeCloseTo(0.86, 2);
        });

        it('should handle zero receivables at start of period', async () => {
            const now = new Date();
            const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );

            // Создаем только счета в текущем месяце (нет счетов из предыдущего месяца)
            const invoice1 = new InvoiceModelTest({
                invoiceNumber: 'INV-007',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 1 * 24 * 60 * 60 * 1000),
                dueDate: new Date(currentMonthStart.getTime() + 31 * 24 * 60 * 60 * 1000),
                totalAmount: 100000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await invoice1.save();

            const response = await request(app)
                .get('/api/v1/reports/dashboard/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('averageReceivables');
            expect(response.body).toHaveProperty('turnoverRatio');
            expect(response.body).toHaveProperty('periodRevenue');

            // ДЗ на начало = 0
            // ДЗ на конец = 100000
            // Средняя ДЗ = (0 + 100000) / 2 = 50000
            // Выручка за период = 100000
            // Оборачиваемость = 100000 / 50000 = 2.0

            expect(response.body.periodRevenue).toBe(100000);
            expect(response.body.averageReceivables).toBe(50000);
            expect(response.body.turnoverRatio).toBe(2.0);
        });

        it('should handle zero average receivables (division by zero)', async () => {
            // Не создаем никаких счетов
            const response = await request(app)
                .get('/api/v1/reports/dashboard/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('averageReceivables');
            expect(response.body).toHaveProperty('turnoverRatio');
            expect(response.body).toHaveProperty('periodRevenue');

            // Все должно быть 0
            expect(response.body.periodRevenue).toBe(0);
            expect(response.body.averageReceivables).toBe(0);
            expect(response.body.turnoverRatio).toBe(0);
        });

        it('should exclude paid invoices from receivables calculation', async () => {
            const now = new Date();
            const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );
            const previousMonthEnd = new Date(currentMonthStart);
            previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

            // Создаем оплаченный счет из предыдущего месяца (не должен учитываться)
            const paidInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-PAID',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 10 * 24 * 60 * 60 * 1000),
                dueDate: new Date(previousMonthEnd.getTime() + 20 * 24 * 60 * 60 * 1000),
                totalAmount: 50000,
                paidAmount: 50000, // Полностью оплачен
                paymentTermDays: 30,
                status: 'PAID',
                debtWorkStatus: 'CLOSED',
            });
            await paidInvoice.save();

            // Создаем неоплаченный счет из предыдущего месяца
            const unpaidInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-UNPAID',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 5 * 24 * 60 * 60 * 1000),
                dueDate: new Date(previousMonthEnd.getTime() + 25 * 24 * 60 * 60 * 1000),
                totalAmount: 30000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await unpaidInvoice.save();

            // Создаем счет в текущем месяце
            const currentInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-CURRENT',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 2 * 24 * 60 * 60 * 1000),
                dueDate: new Date(currentMonthStart.getTime() + 32 * 24 * 60 * 60 * 1000),
                totalAmount: 40000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await currentInvoice.save();

            const response = await request(app)
                .get('/api/v1/reports/dashboard/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);

            // ДЗ на начало = 30000 (только неоплаченный счет)
            // ДЗ на конец = 70000 (30000 + 40000)
            // Средняя ДЗ = (30000 + 70000) / 2 = 50000
            // Выручка за период = 40000
            // Оборачиваемость = 40000 / 50000 = 0.8

            expect(response.body.periodRevenue).toBe(40000);
            expect(response.body.averageReceivables).toBe(50000);
            expect(response.body.turnoverRatio).toBe(0.8);
        });

        it('should handle partially paid invoices correctly', async () => {
            const now = new Date();
            const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );
            const previousMonthEnd = new Date(currentMonthStart);
            previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

            // Создаем частично оплаченный счет из предыдущего месяца
            const partialPaidInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-PARTIAL',
                customerId: testCustomerId,
                issueDate: new Date(previousMonthEnd.getTime() - 10 * 24 * 60 * 60 * 1000),
                dueDate: new Date(previousMonthEnd.getTime() + 20 * 24 * 60 * 60 * 1000),
                totalAmount: 100000,
                paidAmount: 40000, // Частично оплачен, остаток 60000
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await partialPaidInvoice.save();

            // Создаем счет в текущем месяце
            const currentInvoice = new InvoiceModelTest({
                invoiceNumber: 'INV-CURRENT-2',
                customerId: testCustomerId,
                issueDate: new Date(currentMonthStart.getTime() + 2 * 24 * 60 * 60 * 1000),
                dueDate: new Date(currentMonthStart.getTime() + 32 * 24 * 60 * 60 * 1000),
                totalAmount: 50000,
                paidAmount: 0,
                paymentTermDays: 30,
                status: 'OPEN',
                debtWorkStatus: 'IN_TIME',
            });
            await currentInvoice.save();

            const response = await request(app)
                .get('/api/v1/reports/dashboard/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);

            // ДЗ на начало = 60000 (100000 - 40000)
            // ДЗ на конец = 110000 (60000 + 50000)
            // Средняя ДЗ = (60000 + 110000) / 2 = 85000
            // Выручка за период = 50000
            // Оборачиваемость = 50000 / 85000 ≈ 0.59

            expect(response.body.periodRevenue).toBe(50000);
            expect(response.body.averageReceivables).toBe(85000);
            expect(response.body.turnoverRatio).toBeCloseTo(0.59, 2);
        });
    });
});

