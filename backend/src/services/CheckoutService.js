const { Op, literal } = require('sequelize');
const stripe = require('stripe');

class CheckoutService {
    constructor(Order, OrderItem, Product, Cart, Payment) {
        this.Order = Order;
        this.OrderItem = OrderItem;
        this.Product = Product;
        this.Cart = Cart;
        this.Payment = Payment;
    }

    static generateOrderNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    }

    async getCartItems(userId, cartService) {
        const cart = await cartService.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            throw Object.assign(new Error('Your cart is empty'), {
                code: 'CART_EMPTY',
                status: 400
            });
        }
        return cart.items;
    }

    async validateStock(items) {
        const productIds = items.map((item) => Number(item.productId));
        const products = await this.Product.findAll({
            where: { id: { [Op.in]: productIds } }
        });

        const productMap = new Map(products.map((product) => [product.id, product]));

        const validationErrors = [];
        for (const item of items) {
            const product = productMap.get(Number(item.productId));
            if (!product) {
                validationErrors.push({
                    productId: item.productId,
                    message: 'Product no longer exists'
                });
            } else if (product.stock < Number(item.quantity)) {
                validationErrors.push({
                    productId: item.productId,
                    name: product.name,
                    availableStock: product.stock,
                    requested: Number(item.quantity),
                    message: `Only ${product.stock} units available for ${product.name}`
                });
            }
        }

        if (validationErrors.length > 0) {
            const error = new Error('Some items in your cart are no longer available');
            error.code = 'STOCK_VALIDATION_FAILED';
            error.status = 409;
            error.validationErrors = validationErrors;
            throw error;
        }

        return productMap;
    }

    async createOrder(userId, items, shippingAddress = null) {
        const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
        const shipping = subtotal > 100 ? 0 : 9.99;
        const tax = Number((subtotal * 0.08).toFixed(2));
        const total = Number((subtotal + shipping + tax).toFixed(2));

        const order = await this.Order.create({
            userId,
            status: 'pending',
            subtotal: Number(subtotal.toFixed(2)),
            tax,
            shippingCost: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            currency: 'USD',
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
            orderNumber: CheckoutService.generateOrderNumber()
        });

        const orderItems = await Promise.all(
            items.map((item) =>
                this.OrderItem.create({
                    orderId: order.id,
                    productId: Number(item.productId),
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    lineTotal: Number((Number(item.unitPrice) * Number(item.quantity)).toFixed(2)),
                    productSnapshot: {
                        name: item.name
                    }
                })
            )
        );

        return { order, orderItems, total };
    }

    async createCheckoutSession(userId, items, cartService) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw Object.assign(new Error('Payment configuration missing'), {
                code: 'STRIPE_NOT_CONFIGURED',
                status: 500
            });
        }

        await this.validateStock(items);

        const { order, total } = await this.createOrder(userId, items);

        const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Order #${order.orderNumber}`
                        },
                        unit_amount: Math.round(total * 100)
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${process.env.CHECKOUT_SUCCESS_URL || 'http://localhost:3000/checkout/success'}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CHECKOUT_CANCEL_URL || 'http://localhost:3000/checkout/cancel'}?order_id=${order.id}`,
            metadata: {
                orderId: order.id.toString(),
                orderNumber: order.orderNumber,
                userId: userId.toString()
            }
        });

        await this.Order.update(
            { stripePaymentIntentId: session.payment_intent },
            { where: { id: order.id } }
        );

        await this.Payment.create({
            orderId: order.id,
            amount: total,
            currency: 'USD',
            provider: 'stripe',
            providerPaymentId: session.payment_intent,
            status: 'pending',
            metadata: {
                sessionId: session.id,
                userId: userId.toString()
            }
        });

        return {
            sessionId: session.id,
            sessionUrl: session.url,
            orderId: order.id,
            orderNumber: order.orderNumber
        };
    }

    async handleWebhook(payload, signature) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw Object.assign(new Error('Payment configuration missing'), {
                code: 'STRIPE_NOT_CONFIGURED',
                status: 500
            });
        }

        const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;
        try {
            event = stripeInstance.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            throw Object.assign(new Error('Webhook signature verification failed'), {
                code: 'WEBHOOK_INVALID',
                status: 401
            });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = Number(session.metadata?.orderId);

            if (!orderId) {
                throw Object.assign(new Error('Order ID missing from session metadata'), {
                    code: 'ORDER_ID_MISSING',
                    status: 400
                });
            }

            await this.markOrderPaid(orderId, session.payment_intent, session.amount_total / 100);
        } else if (event.type === 'checkout.session.async_payment_failed') {
            const session = event.data.object;
            const orderId = Number(session.metadata?.orderId);

            if (!orderId) {
                throw Object.assign(new Error('Order ID missing from session metadata'), {
                    code: 'ORDER_ID_MISSING',
                    status: 400
                });
            }

            await this.markOrderFailed(orderId, session.payment_intent, 'Payment failed');
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const orderId = Number(paymentIntent.metadata?.orderId);

            if (!orderId) {
                throw Object.assign(new Error('Order ID missing from payment intent metadata'), {
                    code: 'ORDER_ID_MISSING',
                    status: 400
                });
            }

            const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
            await this.markOrderFailed(orderId, paymentIntent.id, errorMessage);
        }

        return { received: true, eventType: event.type };
    }

    async markOrderPaid(orderId, providerPaymentId, amount) {
        const order = await this.Order.findByPk(orderId, {
            include: [
                { model: this.OrderItem, as: 'items' },
                { model: this.Payment, as: 'payments' }
            ]
        });

        if (!order) {
            throw Object.assign(new Error('Order not found'), {
                code: 'ORDER_NOT_FOUND',
                status: 404
            });
        }

        if (order.status === 'paid') {
            return order;
        }

        if (order.status === 'canceled') {
            throw Object.assign(new Error('Cannot pay for a canceled order'), {
                code: 'ORDER_CANCELED',
                status: 400
            });
        }

        await this.Order.update(
            {
                status: 'paid',
                paidAt: new Date()
            },
            { where: { id: orderId } }
        );

        const payment = await this.Payment.findOne({
            where: { orderId, providerPaymentId }
        });

        if (payment) {
            await payment.update({
                status: 'succeeded',
                paidAt: new Date(),
                amount: Number(amount || payment.amount)
            });
        }

        for (const item of order.items) {
            const product = await this.Product.findByPk(item.productId);
            if (product) {
                await product.update({
                    stock: this.Product.sequelize.literal(`stock - ${item.quantity}`)
                });
            }
        }

        return this.Order.findByPk(orderId, {
            include: [
                { model: this.OrderItem, as: 'items' },
                { model: this.Payment, as: 'payments' }
            ]
        });
    }

    async markOrderFailed(orderId, providerPaymentId, errorMessage) {
        const order = await this.Order.findByPk(orderId);
        if (!order) {
            throw Object.assign(new Error('Order not found'), {
                code: 'ORDER_NOT_FOUND',
                status: 404
            });
        }

        const payment = await this.Payment.findOne({
            where: { orderId, providerPaymentId }
        });

        if (payment) {
            await payment.update({
                status: 'failed',
                errorMessage,
                failedAt: new Date()
            });
        }

        await this.Order.update(
            {
                status: 'canceled',
                canceledAt: new Date()
            },
            { where: { id: orderId } }
        );

        return this.Order.findByPk(orderId);
    }

    async cancelOrder(orderId, userId) {
        const order = await this.Order.findOne({
            where: { id: orderId, userId }
        });

        if (!order) {
            throw Object.assign(new Error('Order not found'), {
                code: 'ORDER_NOT_FOUND',
                status: 404
            });
        }

        if (order.status === 'paid') {
            throw Object.assign(new Error('Cannot cancel a paid order. Please request a refund instead.'), {
                code: 'ORDER_ALREADY_PAID',
                status: 400
            });
        }

        if (order.status === 'canceled') {
            throw Object.assign(new Error('Order is already canceled'), {
                code: 'ORDER_ALREADY_CANCELED',
                status: 400
            });
        }

        if (order.status === 'shipped') {
            throw Object.assign(new Error('Cannot cancel a shipped order'), {
                code: 'ORDER_ALREADY_SHIPPED',
                status: 400
            });
        }

        await this.Order.update(
            {
                status: 'canceled',
                canceledAt: new Date()
            },
            { where: { id: orderId } }
        );

        await this.Payment.update(
            { status: 'canceled' },
            { where: { orderId } }
        );

        return this.Order.findByPk(orderId);
    }

    async getOrders(userId, page = 1, limit = 20) {
        const offset = (Number(page) - 1) * Number(limit);
        const { rows, count } = await this.Order.findAndCountAll({
            where: { userId },
            include: [
                { model: this.OrderItem, as: 'items' },
                { model: this.Payment, as: 'payments' }
            ],
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset: Number(offset)
        });

        return {
            orders: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                pages: Math.ceil(count / Number(limit))
            }
        };
    }

    async getOrderById(orderId, userId) {
        const order = await this.Order.findOne({
            where: { id: orderId, userId },
            include: [
                { model: this.OrderItem, as: 'items' },
                { model: this.Payment, as: 'payments' }
            ]
        });

        if (!order) {
            throw Object.assign(new Error('Order not found'), {
                code: 'ORDER_NOT_FOUND',
                status: 404
            });
        }

        return order;
    }

    async shipOrder(orderId, userId) {
        const order = await this.Order.findOne({
            where: { id: orderId, userId, status: 'paid' }
        });

        if (!order) {
            throw Object.assign(new Error('Order not found or not eligible for shipment'), {
                code: 'ORDER_NOT_FOUND',
                status: 404
            });
        }

        await this.Order.update(
            {
                status: 'shipped',
                shippedAt: new Date()
            },
            { where: { id: orderId } }
        );

        return this.Order.findByPk(orderId);
    }
}

module.exports = CheckoutService;
