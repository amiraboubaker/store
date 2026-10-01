const ProductService = require('../services/ProductService');

class ProductController {
    constructor(Product) {
        this.productService = new ProductService(Product);
    }

    async listProducts(req, res, next) {
        try {
            const result = await this.productService.listProducts(req.query);
            res.status(200).json({
                status: 'success',
                code: 'PRODUCTS_RETRIEVED',
                message: 'Products retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getProduct(req, res, next) {
        try {
            const product = await this.productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }

            res.status(200).json({
                status: 'success',
                code: 'PRODUCT_RETRIEVED',
                message: 'Product retrieved successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req, res, next) {
        try {
            const product = await this.productService.createProduct(req.body);
            res.status(201).json({
                status: 'success',
                code: 'PRODUCT_CREATED',
                message: 'Product created successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const product = await this.productService.updateProduct(req.params.id, req.body);
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }

            res.status(200).json({
                status: 'success',
                code: 'PRODUCT_UPDATED',
                message: 'Product updated successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const deleted = await this.productService.deleteProduct(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }

            res.status(200).json({
                status: 'success',
                code: 'PRODUCT_DELETED',
                message: 'Product deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ProductController;
