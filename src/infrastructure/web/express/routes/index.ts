// src/infrastructure/web/express/routes/index.ts
import { Router } from 'express';
import authRouter from './auth.routes';
import reportRouter from './report.routes';
// import userRouter from './user.routes';
// import customerRouter from './customer.routes';
// import invoiceRouter from './invoice.routes';
// import dataUploadRouter from './dataUpload.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/reports', reportRouter);
// router.use('/users', userRouter); // TODO
// router.use('/customers', customerRouter); // TODO
// router.use('/invoices', invoiceRouter); // TODO
// router.use('/data-uploads', dataUploadRouter); // TODO

export default router;
