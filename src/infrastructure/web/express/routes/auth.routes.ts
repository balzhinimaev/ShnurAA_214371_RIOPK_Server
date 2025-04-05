// src/infrastructure/web/express/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
// import AuthController from '../controllers/auth.controller'; // TODO: Реализовать контроллер
// import { validate } from '../middlewares/validation.middleware'; // TODO: Реализовать валидацию
// import { registerUserSchema, loginUserSchema } from '../../../../application/dtos/auth'; // TODO: Определить схемы DTO

const router = Router();
// const authController = new AuthController(); // TODO: Инстанцировать контроллер (лучше через DI)

// Placeholder - Заменить на вызовы методов контроллера
router.post(
    '/register',
    /* validate(registerUserSchema), authController.register */ (
        _req: Request,
        res: Response,
    ) => {
        res.status(501).json({ message: 'Register Not Implemented' });
    },
);

router.post(
    '/login',
    /* validate(loginUserSchema), authController.login */ (
        _req: Request,
        res: Response,
    ) => {
        res.status(501).json({ message: 'Login Not Implemented' });
    },
);

// TODO: Добавить middleware аутентификации для /me
router.get(
    '/me',
    /* authMiddleware, authController.getMe */ (
        _req: Request,
        res: Response,
    ) => {
        res.status(501).json({ message: 'Get Me Not Implemented' });
    },
);

export default router;
