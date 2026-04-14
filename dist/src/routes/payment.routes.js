"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// payment.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
router.post('/notify', payment_controller_1.payfastITN); // PayFast ITN — no auth
router.post('/initialize', auth_middleware_1.requireAuth, payment_controller_1.initializePayment);
router.get('/verify/:reference', auth_middleware_1.requireAuth, payment_controller_1.verifyPayment);
exports.default = router;
