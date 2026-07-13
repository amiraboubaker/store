const express = require('express');
const CheckoutController = require('../controllers/CheckoutController');
const { createAuthMiddleware } = require('../middleware/auth');

module.exports = (User, Product, Cart, Order, OrderItem, Payment) => {
    const router = express.Router();
    const { authMiddleware } = createAuthMiddleware(User);
    const checkoutService = new (require('../services/CheckoutService'))(Order, OrderItem, Product, Cart, Payment);
    const cartService = new (require('../services/CartService'))(Cart, User, Product);
    const checkoutController = new CheckoutController(checkoutService, cartService);

    router.post('/create-session', authMiddleware, (req, res, next) => checkoutController.createCheckoutSession(req, res, next));
    router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => checkoutController.handleWebhook(req, res, next));
    router.get('/orders', authMiddleware, (req, res, next) => checkoutController.getOrders(req, res, next));
    router.get('/orders/:orderId', authMiddleware, (req, res, next) => checkoutController.getOrderById(req, res, next));
    router.post('/orders/:orderId/cancel', authMiddleware, (req, res, next) => checkoutController.cancelOrder(req, res, next));
    router.post('/orders/:orderId/ship', authMiddleware, (req, res, next) => checkoutController.shipOrder(req, res, next));

    return router;
};
