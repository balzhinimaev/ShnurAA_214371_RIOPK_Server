// src/infrastructure/web/express/routes/report.routes.ts
import { Router, Request, Response } from 'express';
// import ReportController from '../controllers/report.controller'; // TODO
// import { authMiddleware } from '../middlewares/auth.middleware'; // TODO

const router = Router();
// const reportController = new ReportController(); // TODO

// TODO: Добавить authMiddleware ко всем роутам отчетов
router.get(
    '/dashboard/summary',
    /* authMiddleware, reportController.getDashboardSummary */ (
        _req: Request,
        res: Response,
    ) => {
        res.status(501).json({ message: 'Dashboard Summary Not Implemented' });
    },
);

router.get(
    '/aging',
    /* authMiddleware, reportController.getAgingReport */ (
        _req: Request,
        res: Response,
    ) => {
        res.status(501).json({ message: 'Aging Report Not Implemented' });
    },
);

export default router;
