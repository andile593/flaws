"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.paystackWebhook = exports.initializePayment = void 0;
const https_1 = __importDefault(require("https"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
// Initialize transaction — called before popup opens
const initializePayment = async (req, res) => {
    try {
        const { addressId } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!addressId)
            return res.status(400).json({ message: 'Address required' });
        // Get user
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Get cart
        const cartItems = await prisma_1.default.cart.findMany({
            where: { userId },
            include: {
                variant: true,
                product: true,
            },
        });
        if (cartItems.length === 0)
            return res.status(400).json({ message: 'Cart is empty' });
        // Calculate total
        const subtotal = cartItems.reduce((sum, item) => {
            const price = Number(item.variant.salePrice ?? item.variant.price);
            return sum + price * item.quantity;
        }, 0);
        const shipping = subtotal >= 1000 ? 0 : 100;
        const total = subtotal + shipping;
        // Generate unique reference
        const reference = `FLAWS-${Date.now()}-${Math.random().toString(36).slice(2).toUpperCase()}`;
        // Initialize with Paystack
        const params = JSON.stringify({
            email: user.email,
            amount: Math.round(total * 100), // Paystack uses kobo/cents
            currency: 'ZAR',
            reference,
            metadata: {
                userId,
                addressId,
                custom_fields: [
                    { display_name: 'Customer', variable_name: 'customer', value: user.name },
                ],
            },
        });
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        };
        const paystackRes = await new Promise((resolve, reject) => {
            const reqPaystack = https_1.default.request(options, (paystackResponse) => {
                let data = '';
                paystackResponse.on('data', chunk => data += chunk);
                paystackResponse.on('end', () => resolve(JSON.parse(data)));
            });
            reqPaystack.on('error', reject);
            reqPaystack.write(params);
            reqPaystack.end();
        });
        if (!paystackRes.status) {
            return res.status(400).json({ message: 'Failed to initialize payment' });
        }
        res.json({
            reference: paystackRes.data.reference,
            accessCode: paystackRes.data.access_code,
            publicKey: process.env.PAYSTACK_PUBLIC_KEY,
            amount: total,
            email: user.email,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.initializePayment = initializePayment;
// Webhook — called by Paystack after payment
const paystackWebhook = async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto_1.default
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Invalid signature');
    }
    const event = req.body;
    if (event.event === 'charge.success') {
        const { reference, metadata, amount } = event.data;
        const { userId, addressId } = metadata;
        try {
            // Verify transaction isn't already processed
            const existing = await prisma_1.default.order.findFirst({
                where: { paystackReference: reference },
            });
            if (existing)
                return res.sendStatus(200);
            // Get cart items
            const cartItems = await prisma_1.default.cart.findMany({
                where: { userId },
                include: { variant: true, product: true },
            });
            if (cartItems.length === 0)
                return res.sendStatus(200);
            const subtotal = cartItems.reduce((sum, item) => {
                const price = Number(item.variant.salePrice ?? item.variant.price);
                return sum + price * item.quantity;
            }, 0);
            const shipping = subtotal >= 1000 ? 0 : 100;
            const total = amount / 100; // convert back from cents
            // Create order
            await prisma_1.default.order.create({
                data: {
                    userId,
                    addressId,
                    status: 'CONFIRMED',
                    subtotal,
                    shippingCost: shipping,
                    discount: 0,
                    total,
                    paystackReference: reference,
                    items: {
                        create: cartItems.map(item => {
                            const unitPrice = Number(item.variant.salePrice ?? item.variant.price);
                            const total = unitPrice * item.quantity;
                            return {
                                variantId: item.variantId,
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice,
                                total,
                            };
                        }),
                    },
                },
            });
            // Clear cart
            await prisma_1.default.cart.deleteMany({ where: { userId } });
        }
        catch (err) {
            console.error('Webhook error:', err);
        }
    }
    res.sendStatus(200);
};
exports.paystackWebhook = paystackWebhook;
// Verify payment — called by frontend after popup closes
const verifyPayment = async (req, res) => {
    try {
        const reference = req.params.reference;
        const userId = req.user?.id;
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${reference}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        };
        const paystackRes = await new Promise((resolve, reject) => {
            const reqPaystack = https_1.default.request(options, (paystackResponse) => {
                let data = '';
                paystackResponse.on('data', chunk => data += chunk);
                paystackResponse.on('end', () => resolve(JSON.parse(data)));
            });
            reqPaystack.on('error', reject);
            reqPaystack.end();
        });
        if (!paystackRes.data || paystackRes.data.status !== 'success') {
            return res.status(400).json({ message: 'Payment not successful' });
        }
        const order = await prisma_1.default.order.findFirst({
            where: { paystackReference: reference, userId },
        });
        if (!order) {
            await new Promise(r => setTimeout(r, 2000));
            const retryOrder = await prisma_1.default.order.findFirst({
                where: { paystackReference: reference, userId },
            });
            if (!retryOrder)
                return res.status(404).json({ message: 'Order not found' });
            return res.json({ orderId: retryOrder.id });
        }
        res.json({ orderId: order.id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.verifyPayment = verifyPayment;
