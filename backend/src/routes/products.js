const express = require('express');
const ProductController = require('../controllers/ProductController');
const { createAuthMiddleware, roleMiddleware } = require('../middleware/auth');
const {
    validateProductCreation,
    validateProductQuery,
    handleProductValidationErrors
} = require('../middleware/productValidation');

module.exports = (User, Product) => {
    const router = express.Router();
    const { authMiddleware } = createAuthMiddleware(User);
    const productController = new ProductController(Product);

    router.get(
        '/',
        validateProductQuery,
        handleProductValidationErrors,
        (req, res, next) => productController.listProducts(req, res, next)
    );

    router.get('/:id', (req, res, next) => productController.getProduct(req, res, next));

    router.post(
        '/',
        authMiddleware,
        roleMiddleware(['admin']),
        validateProductCreation,
        handleProductValidationErrors,
        (req, res, next) => productController.createProduct(req, res, next)
    );

    router.put(
        '/:id',
        authMiddleware,
        roleMiddleware(['admin']),
        validateProductCreation,
        handleProductValidationErrors,
        (req, res, next) => productController.updateProduct(req, res, next)
    );

    router.delete(
        '/:id',
        authMiddleware,
        roleMiddleware(['admin']),
        (req, res, next) => productController.deleteProduct(req, res, next)
    );

    return router;
};
