"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
// Webhook must use raw body — register before express.json parses it
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), payment_controller_1.paystackWebhook);
router.post('/initialize', auth_middleware_1.requireAuth, payment_controller_1.initializePayment);
router.get('/verify/:reference', auth_middleware_1.requireAuth, payment_controller_1.verifyPayment);
exports.default = router;
