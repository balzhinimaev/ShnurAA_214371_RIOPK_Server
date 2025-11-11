"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/di/container.config.ts
const tsyringe_1 = require("tsyringe");
const mongoose_1 = __importDefault(require("mongoose")); // <-- Импорт mongoose
// --- Токены и Интерфейсы ---
// Domain / Application Interfaces and Tokens
const IPasswordHasher_1 = require("../../application/interfaces/IPasswordHasher");
const IJwtService_1 = require("../../application/interfaces/IJwtService");
const IUserRepository_1 = require("../../domain/repositories/IUserRepository");
const ICustomerRepository_1 = require("../../domain/repositories/ICustomerRepository");
const IInvoiceRepository_1 = require("../../domain/repositories/IInvoiceRepository");
// import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
// import { GetUserByIdUseCase } from '../../application/use-cases/users/get-user-by-id.use-case';
// import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
// import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case';
// --- Конкретные Реализации (Infrastructure) ---
// Токен для Mongoose Connection (предполагаем, что он экспортируется из user.repository или общего места)
const user_repository_1 = require("../database/mongoose/repositories/user.repository");
// Репозитории
const user_repository_2 = require("../database/mongoose/repositories/user.repository");
const customer_repository_1 = require("../database/mongoose/repositories/customer.repository");
const invoice_repository_1 = require("../database/mongoose/repositories/invoice.repository");
// Сервисы
const bcrypt_password_hasher_1 = require("../services/bcrypt.password-hasher");
const jsonwebtoken_service_1 = require("../services/jsonwebtoken.service");
// --- Use Cases ---
const register_user_use_case_1 = require("../../application/use-cases/auth/register-user.use-case");
const login_user_use_case_1 = require("../../application/use-cases/auth/login-user.use-case");
const get_dashboard_summary_use_case_1 = require("../../application/use-cases/reports/get-dashboard-summary.use-case");
const get_top_debtors_use_case_1 = require("../../application/use-cases/reports/get-top-debtors.use-case");
const list_invoices_use_case_1 = require("../../application/use-cases/reports/list-invoices.use-case");
const apply_payment_use_case_1 = require("../../application/use-cases/reports/apply-payment.use-case");
const process_invoice_upload_use_case_1 = require("../../application/use-cases/data-uploads/process-invoice-upload.use-case");
const process_1c_invoice_upload_use_case_1 = require("../../application/use-cases/data-uploads/process-1c-invoice-upload.use-case");
// --- РЕГИСТРАЦИЯ ЗАВИСИМОСТЕЙ ---
// 1. Базовые сервисы и конфигурация инфраструктуры
// Регистрируем ДЕФОЛТНОЕ соединение Mongoose под специальным токеном.
// В тестах это значение будет ПЕРЕОПРЕДЕЛЕНО в jest.setup.ts.
tsyringe_1.container.register(user_repository_1.MongooseConnectionToken, {
    useValue: mongoose_1.default.connection, // Передаем стандартное соединение Mongoose
});
// console.log(`[DI_CONFIG] Registered default mongoose connection for token ${MongooseConnectionToken.toString()}`); // Лог для отладки
// Сервис Хеширования Паролей
tsyringe_1.container.register(IPasswordHasher_1.PasswordHasherToken, {
    useClass: bcrypt_password_hasher_1.BcryptPasswordHasher,
});
// Сервис JWT
tsyringe_1.container.register(IJwtService_1.JwtServiceToken, {
    useClass: jsonwebtoken_service_1.JsonWebTokenService,
});
// 2. Регистрация Репозиториев
// Предполагается, что все Mongo*Repository классы теперь принимают
// @inject(MongooseConnectionToken) connection: Connection в конструкторе.
tsyringe_1.container.register(IUserRepository_1.UserRepositoryToken, {
    useClass: user_repository_2.MongoUserRepository,
});
// TODO: Адаптируйте MongoCustomerRepository, чтобы он принимал Connection через DI
tsyringe_1.container.register(ICustomerRepository_1.CustomerRepositoryToken, {
    useClass: customer_repository_1.MongoCustomerRepository,
});
// TODO: Адаптируйте MongoInvoiceRepository, чтобы он принимал Connection через DI
tsyringe_1.container.register(IInvoiceRepository_1.InvoiceRepositoryToken, {
    useClass: invoice_repository_1.MongoInvoiceRepository,
});
// 3. Регистрация Use Cases
// Use Cases зависят от интерфейсов репозиториев/сервисов,
// контейнер сам подставит зарегистрированные реализации.
tsyringe_1.container.register(register_user_use_case_1.RegisterUserUseCase, {
    useClass: register_user_use_case_1.RegisterUserUseCase,
});
tsyringe_1.container.register(login_user_use_case_1.LoginUserUseCase, {
    useClass: login_user_use_case_1.LoginUserUseCase,
});
tsyringe_1.container.register(get_dashboard_summary_use_case_1.GetDashboardSummaryUseCase, {
    useClass: get_dashboard_summary_use_case_1.GetDashboardSummaryUseCase,
});
tsyringe_1.container.register(get_top_debtors_use_case_1.GetTopDebtorsUseCase, {
    useClass: get_top_debtors_use_case_1.GetTopDebtorsUseCase,
});
tsyringe_1.container.register(list_invoices_use_case_1.ListInvoicesUseCase, {
    useClass: list_invoices_use_case_1.ListInvoicesUseCase,
});
tsyringe_1.container.register(apply_payment_use_case_1.ApplyPaymentUseCase, {
    useClass: apply_payment_use_case_1.ApplyPaymentUseCase,
});
tsyringe_1.container.register(process_invoice_upload_use_case_1.ProcessInvoiceUploadUseCase, {
    useClass: process_invoice_upload_use_case_1.ProcessInvoiceUploadUseCase,
});
tsyringe_1.container.register(process_1c_invoice_upload_use_case_1.Process1cInvoiceUploadUseCase, {
    useClass: process_1c_invoice_upload_use_case_1.Process1cInvoiceUploadUseCase,
});
// --- Регистрация Controllers ---
// Обычно контроллеры не регистрируют явно, если они не внедряются куда-то еще.
// Если ваши роутеры используют container.resolve(Controller), то регистрация не нужна,
// если Controller помечен @injectable() и все его зависимости зарегистрированы.
// Пример явной регистрации (если потребуется):
// import { AuthController } from '../web/express/controllers/auth.controller';
// container.register<AuthController>(AuthController);
// Экспорт контейнера не обязателен для работы tsyringe, но может быть полезен для явного использования в некоторых случаях
exports.default = tsyringe_1.container;
//# sourceMappingURL=container.config.js.map