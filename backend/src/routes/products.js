const express = require('express');
const ProductController = require('../controllers/ProductController');
const {
    validateProductCreation,
    validateProductQuery,
    handleProductValidationErrors
} = require('../middleware/productValidation');

module.exports = (Product) => {
    const router = express.Router();
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
        validateProductCreation,
        handleProductValidationErrors,
        (req, res, next) => productController.createProduct(req, res, next)
    );

    router.put(
        '/:id',
        validateProductCreation,
        handleProductValidationErrors,
        (req, res, next) => productController.updateProduct(req, res, next)
    );

    router.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

    return router;
};