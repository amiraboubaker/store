class CheckoutController {
    constructor(checkoutService, cartService) {
        this.checkoutService = checkoutService;
        this.cartService = cartService;
    }

    async createCheckoutSession(req, res, next) {
        try {
            const userId = req.user.id;
            const items = await this.checkoutService.getCartItems(userId, this.cartService);
            const result = await this.checkoutService.createCheckoutSession(userId, items, this.cartService);
            res.status(200).json({
                status: 'success',
                code: 'CHECKOUT_SESSION_CREATED',
                message: 'Checkout session created',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async handleWebhook(req, res, next) {
        try {
            const sig = req.headers['stripe-signature'];
            if (!sig) {
                return res.status(400).json({
                    status: 'error',
                    code: 'MISSING_SIGNATURE',
                    message: 'Missing Stripe signature',
                    data: null
                });
            }

            const payload = req.rawBody || req.body;
            const result = await this.checkoutService.handleWebhook(payload, sig);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getOrders(req, res, next) {
        try {
            const userId = req.user.id;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const result = await this.checkoutService.getOrders(userId, page, limit);
            res.status(200).json({
                status: 'success',
                code: 'ORDERS_RETRIEVED',
                message: 'Orders retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const userId = req.user.id;
            const orderId = Number(req.params.orderId);
            const order = await this.checkoutService.getOrderById(orderId, userId);
            res.status(200).json({
                status: 'success',
                code: 'ORDER_RETRIEVED',
                message: 'Order retrieved successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    async cancelOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const orderId = Number(req.params.orderId);
            const order = await this.checkoutService.cancelOrder(orderId, userId);
            res.status(200).json({
                status: 'success',
                code: 'ORDER_CANCELED',
                message: 'Order canceled successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    async shipOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const orderId = Number(req.params.orderId);
            const order = await this.checkoutService.shipOrder(orderId, userId);
            res.status(200).json({
                status: 'success',
                code: 'ORDER_SHIPPED',
                message: 'Order marked as shipped',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CheckoutController;
