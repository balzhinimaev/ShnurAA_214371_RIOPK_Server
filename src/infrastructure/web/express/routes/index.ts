// src/infrastructure/web/express/routes/index.ts
import { Router } from 'express';
import authRouter from './auth.routes';
import reportRouter from './report.routes';
import userRouter from './user.routes';
import dataUploadRouter from './data-upload.routes';
// import userRouter from './user.routes';
import customerRouter from './customer.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/reports', reportRouter);
router.use('/data-uploads', dataUploadRouter);
router.use('/users', userRouter);
router.use('/customers', customerRouter);
// router.use('/invoices', invoiceRouter); // TODO

export default router;
