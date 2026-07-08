class CartController {
    constructor(cartService) {
        this.cartService = cartService;
    }

    async getCart(req, res, next) {
        try {
            const cart = await this.cartService.getCart(req.user.id);
            res.status(200).json({
                status: 'success',
                code: 'CART_RETRIEVED',
                message: 'Cart retrieved successfully',
                data: cart
            });
        } catch (error) {
            next(error);
        }
    }

    async addItem(req, res, next) {
        try {
            const cart = await this.cartService.addItem(req.user.id, req.body.productId, req.body.quantity);
            res.status(201).json({
                status: 'success',
                code: 'CART_ITEM_ADDED',
                message: 'Item added to cart',
                data: cart
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async updateItem(req, res, next) {
        try {
            const cart = await this.cartService.updateItem(req.user.id, req.params.productId, req.body.quantity);
            res.status(200).json({
                status: 'success',
                code: 'CART_ITEM_UPDATED',
                message: 'Cart item updated',
                data: cart
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async removeItem(req, res, next) {
        try {
            const cart = await this.cartService.removeItem(req.user.id, req.params.productId);
            res.status(200).json({
                status: 'success',
                code: 'CART_ITEM_REMOVED',
                message: 'Cart item removed',
                data: cart
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async clearCart(req, res, next) {
        try {
            const cart = await this.cartService.clearCart(req.user.id);
            res.status(200).json({
                status: 'success',
                code: 'CART_CLEARED',
                message: 'Cart cleared',
                data: cart
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    handleError(res, error) {
        if (error && error.status) {
            return res.status(error.status).json({
                status: 'error',
                code: error.code,
                message: error.message,
                data: null
            });
        }
        res.status(500).json({
            status: 'error',
            code: 'CART_OPERATION_FAILED',
            message: 'Cart operation failed',
            data: null
        });
    }
}

module.exports = CartController;
