// src/infrastructure/web/express/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
// TODO: import { authMiddleware } from '../middlewares/auth.middleware';
// TODO: import { validationMiddleware } from '../middlewares/validation.middleware';
// TODO: import { RegisterUserDto } from '../../../../application/dtos/auth/register-user.dto';
// TODO: import { LoginUserDto } from '../../../../application/dtos/auth/login-user.dto';

const router = Router();
const authController = new AuthController(); // Создаем экземпляр контроллера

// POST /api/v1/auth/register
router.post(
    '/register',
    // TODO: Добавить validationMiddleware(RegisterUserDto)
    authController.register, // Связываем с методом контроллера
);

// POST /api/v1/auth/login
router.post(
    '/login',
    // TODO: Добавить validationMiddleware(LoginUserDto)
    authController.login, // Связываем с методом контроллера
);

// GET /api/v1/auth/me
router.get(
    '/me',
    // TODO: Добавить authMiddleware
    authController.getMe, // Связываем с методом контроллера
);

export default router;
