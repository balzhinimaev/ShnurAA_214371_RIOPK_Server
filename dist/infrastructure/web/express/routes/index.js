"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/infrastructure/web/express/routes/index.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const data_upload_routes_1 = __importDefault(require("./data-upload.routes"));
// import userRouter from './user.routes';
const customer_routes_1 = __importDefault(require("./customer.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/reports', report_routes_1.default);
router.use('/data-uploads', data_upload_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/customers', customer_routes_1.default);
// router.use('/invoices', invoiceRouter); // TODO
exports.default = router;
//# sourceMappingURL=index.js.map