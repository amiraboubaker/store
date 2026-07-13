const express = require('express');
const CartController = require('../controllers/CartController');
const { createAuthMiddleware } = require('../middleware/auth');

module.exports = (User, Product, Cart) => {
    const router = express.Router();
    const { authMiddleware } = createAuthMiddleware(User);
    const cartService = new (require('../services/CartService'))(Cart, User, Product);
    const cartController = new CartController(cartService);

    router.get('/', authMiddleware, (req, res, next) => cartController.getCart(req, res, next));
    router.post('/items', authMiddleware, (req, res, next) => cartController.addItem(req, res, next));
    router.put('/items/:productId', authMiddleware, (req, res, next) => cartController.updateItem(req, res, next));
    router.delete('/items/:productId', authMiddleware, (req, res, next) => cartController.removeItem(req, res, next));
    router.delete('/', authMiddleware, (req, res, next) => cartController.clearCart(req, res, next));

    return router;
};
