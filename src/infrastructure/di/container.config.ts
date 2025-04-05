// src/infrastructure/di/container.config.ts
import { container } from 'tsyringe';

// Импортируем токены (интерфейсы) из Domain и Application
import {
    UserRepositoryToken,
    IUserRepository,
} from '../../domain/repositories/IUserRepository';
import {
    PasswordHasherToken,
    IPasswordHasher,
} from '../../application/interfaces/IPasswordHasher';
import {
    JwtServiceToken,
    IJwtService,
} from '../../application/interfaces/IJwtService';

// --- Импорты Customer ---
import {
  CustomerRepositoryToken,
  ICustomerRepository,
} from '../../domain/repositories/ICustomerRepository';
import { MongoCustomerRepository } from '../database/mongoose/repositories/customer.repository'

// --- Импорты Invoice ---
import {
  InvoiceRepositoryToken,
  IInvoiceRepository,
} from '../../domain/repositories/IInvoiceRepository';
import { MongoInvoiceRepository } from '../database/mongoose/repositories/invoice.repository';

// --- Импорты Use Cases ---
import { GetDashboardSummaryUseCase } from '../../application/use-cases/reports/get-dashboard-summary.use-case';

// --- Регистрация репозиториев ---
container.register<ICustomerRepository>(CustomerRepositoryToken, { useClass: MongoCustomerRepository });
container.register<IInvoiceRepository>(InvoiceRepositoryToken, { useClass: MongoInvoiceRepository });

// --- Регистрация Use Cases ---
container.register<GetDashboardSummaryUseCase>(GetDashboardSummaryUseCase, { useClass: GetDashboardSummaryUseCase });

// Импортируем конкретные реализации из Infrastructure
import { MongoUserRepository } from '../database/mongoose/repositories/user.repository';
import { BcryptPasswordHasher } from '../services/bcrypt.password-hasher';
import { JsonWebTokenService } from '../services/jsonwebtoken.service';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case';

// --- Регистрация зависимостей ---

// Репозиторий Пользователей
container.register<IUserRepository>(UserRepositoryToken, {
    useClass: MongoUserRepository, // Когда запрашивают IUserRepository, предоставлять экземпляр MongoUserRepository
});

// Сервис Хеширования Паролей
container.register<IPasswordHasher>(PasswordHasherToken, {
    useClass: BcryptPasswordHasher,
});

// Сервис JWT
container.register<IJwtService>(JwtServiceToken, {
    useClass: JsonWebTokenService,
});

// --- Регистрация Use Cases ---
container.register<RegisterUserUseCase>(RegisterUserUseCase, {
    useClass: RegisterUserUseCase,
});
container.register<LoginUserUseCase>(LoginUserUseCase, {
    useClass: LoginUserUseCase,
});

// --- Регистрация Controllers (будет добавлено позже) ---
// Пример:
// import { AuthController } from '../web/express/controllers/auth.controller';
// container.register<AuthController>(AuthController, { useClass: AuthController });

console.log('DI container configured.');

// Экспортируем настроенный контейнер (хотя обычно мы будем импортировать его напрямую там, где нужно разрешение зависимостей)
export default container;
