// src/infrastructure/web/express/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware'; // <--- Импорт auth
import { validationMiddleware } from '../middlewares/validation.middleware'; // <--- Импорт validation
import { RegisterUserDto } from '../../../../application/dtos/auth/register-user.dto'; // <--- Импорт DTO
import { LoginUserDto } from '../../../../application/dtos/auth/login-user.dto'; // <--- Импорт DTO

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/register
router.post(
    '/register',
    validationMiddleware(RegisterUserDto), // <--- Используем middleware для валидации
    authController.register,
);

// POST /api/v1/auth/login
router.post(
    '/login',
    validationMiddleware(LoginUserDto), // <--- Используем middleware для валидации
    authController.login,
);

// GET /api/v1/auth/me
router.get(
    '/me',
    authMiddleware, // <--- Используем middleware для проверки токена
    authController.getMe,
);

export default router;
