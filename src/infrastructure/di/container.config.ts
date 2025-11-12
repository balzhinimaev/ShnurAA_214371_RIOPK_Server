// src/infrastructure/di/container.config.ts
import { container } from 'tsyringe';
import mongoose from 'mongoose'; // <-- Импорт mongoose

// --- Токены и Интерфейсы ---
// Domain / Application Interfaces and Tokens
import {
    IPasswordHasher,
    PasswordHasherToken,
} from '../../application/interfaces/IPasswordHasher';
import {
    IJwtService,
    JwtServiceToken,
} from '../../application/interfaces/IJwtService';
import {
    IUserRepository,
    UserRepositoryToken,
} from '../../domain/repositories/IUserRepository';
import {
    ICustomerRepository,
    CustomerRepositoryToken,
} from '../../domain/repositories/ICustomerRepository';
import {
    IInvoiceRepository,
    InvoiceRepositoryToken,
} from '../../domain/repositories/IInvoiceRepository';

// import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
// import { GetUserByIdUseCase } from '../../application/use-cases/users/get-user-by-id.use-case';
// import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
// import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case';

// --- Конкретные Реализации (Infrastructure) ---
// Токен для Mongoose Connection (предполагаем, что он экспортируется из user.repository или общего места)
import { MongooseConnectionToken } from '../database/mongoose/repositories/user.repository';
// Репозитории
import { MongoUserRepository } from '../database/mongoose/repositories/user.repository';
import { MongoCustomerRepository } from '../database/mongoose/repositories/customer.repository';
import { MongoInvoiceRepository } from '../database/mongoose/repositories/invoice.repository';
// Сервисы
import { BcryptPasswordHasher } from '../services/bcrypt.password-hasher';
import { JsonWebTokenService } from '../services/jsonwebtoken.service';

// --- Use Cases ---
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case';
import { GetDashboardSummaryUseCase } from '../../application/use-cases/reports/get-dashboard-summary.use-case';
import { GetTopDebtorsUseCase } from '../../application/use-cases/reports/get-top-debtors.use-case';
import { ListInvoicesUseCase } from '../../application/use-cases/reports/list-invoices.use-case';
import { ApplyPaymentUseCase } from '../../application/use-cases/reports/apply-payment.use-case';
import { GetCustomersOverdueUseCase } from '../../application/use-cases/reports/get-customers-overdue.use-case';
import { GetAbcAnalysisUseCase } from '../../application/use-cases/reports/get-abc-analysis.use-case';
import { ProcessInvoiceUploadUseCase } from '../../application/use-cases/data-uploads/process-invoice-upload.use-case';
import { Process1cInvoiceUploadUseCase } from '../../application/use-cases/data-uploads/process-1c-invoice-upload.use-case';

// --- РЕГИСТРАЦИЯ ЗАВИСИМОСТЕЙ ---

// 1. Базовые сервисы и конфигурация инфраструктуры

// Регистрируем ДЕФОЛТНОЕ соединение Mongoose под специальным токеном.
// В тестах это значение будет ПЕРЕОПРЕДЕЛЕНО в jest.setup.ts.
container.register(MongooseConnectionToken, {
    useValue: mongoose.connection, // Передаем стандартное соединение Mongoose
});
// console.log(`[DI_CONFIG] Registered default mongoose connection for token ${MongooseConnectionToken.toString()}`); // Лог для отладки

// Сервис Хеширования Паролей
container.register<IPasswordHasher>(PasswordHasherToken, {
    useClass: BcryptPasswordHasher,
});

// Сервис JWT
container.register<IJwtService>(JwtServiceToken, {
    useClass: JsonWebTokenService,
});

// 2. Регистрация Репозиториев
// Предполагается, что все Mongo*Repository классы теперь принимают
// @inject(MongooseConnectionToken) connection: Connection в конструкторе.

container.register<IUserRepository>(UserRepositoryToken, {
    useClass: MongoUserRepository,
});

// TODO: Адаптируйте MongoCustomerRepository, чтобы он принимал Connection через DI
container.register<ICustomerRepository>(CustomerRepositoryToken, {
    useClass: MongoCustomerRepository,
});

// TODO: Адаптируйте MongoInvoiceRepository, чтобы он принимал Connection через DI
container.register<IInvoiceRepository>(InvoiceRepositoryToken, {
    useClass: MongoInvoiceRepository,
});

// 3. Регистрация Use Cases
// Use Cases зависят от интерфейсов репозиториев/сервисов,
// контейнер сам подставит зарегистрированные реализации.

container.register<RegisterUserUseCase>(RegisterUserUseCase, {
    useClass: RegisterUserUseCase,
});
container.register<LoginUserUseCase>(LoginUserUseCase, {
    useClass: LoginUserUseCase,
});
container.register<GetDashboardSummaryUseCase>(GetDashboardSummaryUseCase, {
    useClass: GetDashboardSummaryUseCase,
});
container.register<GetTopDebtorsUseCase>(GetTopDebtorsUseCase, {
    useClass: GetTopDebtorsUseCase,
});
container.register<ListInvoicesUseCase>(ListInvoicesUseCase, {
    useClass: ListInvoicesUseCase,
});
container.register<ApplyPaymentUseCase>(ApplyPaymentUseCase, {
    useClass: ApplyPaymentUseCase,
});
container.register<GetCustomersOverdueUseCase>(GetCustomersOverdueUseCase, {
    useClass: GetCustomersOverdueUseCase,
});
container.register<GetAbcAnalysisUseCase>(GetAbcAnalysisUseCase, {
    useClass: GetAbcAnalysisUseCase,
});
container.register<ProcessInvoiceUploadUseCase>(ProcessInvoiceUploadUseCase, {
    useClass: ProcessInvoiceUploadUseCase,
});
container.register<Process1cInvoiceUploadUseCase>(
    Process1cInvoiceUploadUseCase,
    {
        useClass: Process1cInvoiceUploadUseCase,
    },
);

// --- Регистрация Controllers ---
// Обычно контроллеры не регистрируют явно, если они не внедряются куда-то еще.
// Если ваши роутеры используют container.resolve(Controller), то регистрация не нужна,
// если Controller помечен @injectable() и все его зависимости зарегистрированы.
// Пример явной регистрации (если потребуется):
// import { AuthController } from '../web/express/controllers/auth.controller';
// container.register<AuthController>(AuthController);

// Экспорт контейнера не обязателен для работы tsyringe, но может быть полезен для явного использования в некоторых случаях
export default container;
