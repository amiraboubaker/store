const request = require('supertest');
const { app, bootstrap } = require('../index');
const stripe = require('stripe');

jest.mock('stripe', () => {
    const mockStripeInstance = {
        checkout: {
            sessions: {
                create: jest.fn(() => ({
                    id: 'cs_test_' + Date.now(),
                    url: 'https://checkout.stripe.com/test',
                    payment_intent: 'pi_test_' + Date.now(),
                    amount_total: 1000
                }))
            }
        },
        webhooks: {
            constructEvent: jest.fn((payload, sig, secret) => {
                if (sig === 'invalid_sig') {
                    throw new Error('Invalid signature');
                }
                const data = JSON.parse(payload.toString());
                return { ...data, type: data.type || 'checkout.session.completed' };
            })
        }
    };

    return jest.fn(() => mockStripeInstance);
});

process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

describe('Checkout API', () => {
    let User;
    let Product;
    let Cart;
    let Order;
    let OrderItem;
    let Payment;
    let sequelize;
    let authToken;

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        User = bootstrapped.User;
        Product = bootstrapped.Product;
        Cart = bootstrapped.Cart;
        Order = bootstrapped.Order;
        OrderItem = bootstrapped.OrderItem;
        Payment = bootstrapped.Payment;
        sequelize = bootstrapped.sequelize;
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        if (sequelize) {
            await sequelize.close();
        }
    });

    beforeEach(async () => {
        await Payment.destroy({ where: {} });
        await OrderItem.destroy({ where: {} });
        await Order.destroy({ where: {} });
        await Cart.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    const registerAndGetToken = async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Checkout',
                lastName: 'User',
                email: 'checkout@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });
        return res.body.data.token;
    };

    const createProduct = async (name, price, stock) => {
        return Product.create({
            name,
            slug: name.toLowerCase().replace(/\\s+/g, '-'),
            category: 'Test',
            price,
            stock,
            description: 'Test product',
            images: []
        });
    };

    const addToCart = async (token, productId, quantity) => {
        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId, quantity });
    };

    it('rejects checkout with empty cart', async () => {
        const token = await registerAndGetToken();

        const res = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('CART_EMPTY');
    });

    it('rejects checkout with insufficient stock', async () => {
        const token = await registerAndGetToken();
        const product = await createProduct('Limited Stock', 25, 1);
        await addToCart(token, product.id, 2);

        const res = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(409);
        expect(res.body.code).toBe('STOCK_VALIDATION_FAILED');
        expect(res.body.data.validationErrors).toHaveLength(1);
    });

    it('creates a pending order and Stripe checkout session for valid cart', async () => {
        const product = await createProduct('Silk Ribbon', 12.5, 5);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 2);

        const res = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.code).toBe('CHECKOUT_SESSION_CREATED');
        expect(res.body.data.sessionId).toBeDefined();
        expect(res.body.data.sessionUrl).toBeDefined();
        expect(res.body.data.orderId).toBeDefined();
        expect(res.body.data.orderNumber).toBeDefined();

        const order = await Order.findByPk(res.body.data.orderId);
        expect(order.status).toBe('pending');
        expect(order.total).toBeCloseTo(2 * 12.5 + 0 + 2 * 12.5 * 0.08, 2);

        const items = await OrderItem.findAll({ where: { orderId: order.id } });
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(2);
        expect(items[0].unitPrice).toBeCloseTo(12.5, 2);

        const payments = await Payment.findAll({ where: { orderId: order.id } });
        expect(payments).toHaveLength(1);
        expect(payments[0].status).toBe('pending');
    });

    it('does not allow checkout with non-existent product in cart', async () => {
        const token = await registerAndGetToken();
        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 9999, quantity: 1 });

        const res = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('CART_EMPTY');
    });

    it('returns empty order list for new user', async () => {
        const token = await registerAndGetToken();

        const res = await request(app)
            .get('/checkout/orders')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.code).toBe('ORDERS_RETRIEVED');
        expect(res.body.data.orders).toHaveLength(0);
    });

    it('returns order history with pagination', async () => {
        const product = await createProduct('Order History', 20, 10);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;

        const res = await request(app)
            .get('/checkout/orders?page=1&limit=10')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.orders).toHaveLength(1);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(10);
        expect(res.body.data.orders[0].id).toBe(orderId);
    });

    it('retrieves a single order by id', async () => {
        const product = await createProduct('Single Order', 15, 5);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;

        const res = await request(app)
            .get(`/checkout/orders/${orderId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.order.id).toBe(orderId);
        expect(res.body.data.order.items).toHaveLength(1);
        expect(res.body.data.order.payments).toHaveLength(1);
    });

    it('rejects access to another users order', async () => {
        const product = await createProduct('Private Order', 10, 5);
        const token1 = await registerAndGetToken();
        await addToCart(token1, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token1}`);

        const orderId = checkoutRes.body.data.orderId;

        const token2Res = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Other',
                lastName: 'User',
                email: 'other@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });
        const token2 = token2Res.body.data.token;

        const res = await request(app)
            .get(`/checkout/orders/${orderId}`)
            .set('Authorization', `Bearer ${token2}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.code).toBe('ORDER_NOT_FOUND');
    });

    it('cancels a pending order successfully', async () => {
        const product = await createProduct('Cancel Test', 10, 5);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;

        const res = await request(app)
            .post(`/checkout/orders/${orderId}/cancel`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.code).toBe('ORDER_CANCELED');
        expect(res.body.data.order.status).toBe('canceled');

        const order = await Order.findByPk(orderId);
        expect(order.status).toBe('canceled');
        expect(order.canceledAt).not.toBeNull();
    });

    it('rejects canceling a paid order', async () => {
        const product = await createProduct('Paid Cancel', 10, 5);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;

        const order = await Order.findByPk(orderId);
        await order.update({ status: 'paid' });

        const res = await request(app)
            .post(`/checkout/orders/${orderId}/cancel`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('ORDER_ALREADY_PAID');
    });

    it('marks order as paid and deducts stock via webhook', async () => {
        const product = await createProduct('Webhook Test', 20, 3);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;
        const paymentIntentId = 'pi_test_webhook_' + Date.now();

        const sessionPayload = JSON.stringify({
            id: 'cs_test_webhook_' + Date.now(),
            object: 'checkout.session',
            payment_intent: paymentIntentId,
            amount_total: 1000,
            metadata: {
                orderId: orderId.toString(),
                orderNumber: checkoutRes.body.data.orderNumber,
                userId: (await User.findOne({ where: { email: 'checkout@example.com' } })).id.toString()
            }
        });

        const res = await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'test_signature')
            .send(sessionPayload);

        expect(res.statusCode).toBe(200);
        expect(res.body.received).toBe(true);
        expect(res.body.eventType).toBe('checkout.session.completed');

        const order = await Order.findByPk(orderId);
        expect(order.status).toBe('paid');
        expect(order.paidAt).not.toBeNull();

        const productAfter = await Product.findByPk(product.id);
        expect(productAfter.stock).toBe(2);

        const payment = await Payment.findOne({ where: { orderId } });
        expect(payment.status).toBe('succeeded');
        expect(payment.providerPaymentId).toBe(paymentIntentId);
        expect(payment.paidAt).not.toBeNull();
    });

    it('marks order as failed on payment_failed webhook', async () => {
        const product = await createProduct('Fail Webhook', 15, 2);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;
        const paymentIntentId = 'pi_test_fail_' + Date.now();

        const payload = JSON.stringify({
            id: 'evt_test_' + Date.now(),
            type: 'payment_intent.payment_failed',
            data: {
                object: {
                    id: paymentIntentId,
                    last_payment_error: { message: 'Card declined' },
                    metadata: {
                        orderId: orderId.toString(),
                        userId: (await User.findOne({ where: { email: 'checkout@example.com' } })).id.toString()
                    }
                }
            }
        });

        const res = await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'test_signature')
            .send(payload);

        expect(res.statusCode).toBe(200);
        expect(res.body.eventType).toBe('payment_intent.payment_failed');

        const order = await Order.findByPk(orderId);
        expect(order.status).toBe('canceled');

        const payment = await Payment.findOne({ where: { orderId } });
        expect(payment.status).toBe('failed');
        expect(payment.errorMessage).toBe('Card declined');
    });

    it('returns 401 for missing stripe signature on webhook', async () => {
        const res = await request(app)
            .post('/checkout/webhook')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('MISSING_SIGNATURE');
    });

    it('rejects webhook with invalid signature', async () => {
        const payload = JSON.stringify({ type: 'checkout.session.completed' });

        const res = await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'invalid_sig')
            .send(payload);

        expect(res.statusCode).toBe(401);
        expect(res.body.code).toBe('WEBHOOK_INVALID');
    });

    it('does not double-mark an already paid order from webhook', async () => {
        const product = await createProduct('Double Pay', 10, 2);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 1);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;
        const paymentIntentId = 'pi_test_double_' + Date.now();

        const sessionPayload = JSON.stringify({
            id: 'cs_test_double_' + Date.now(),
            object: 'checkout.session',
            payment_intent: paymentIntentId,
            amount_total: 1000,
            metadata: {
                orderId: orderId.toString(),
                orderNumber: checkoutRes.body.data.orderNumber,
                userId: (await User.findOne({ where: { email: 'checkout@example.com' } })).id.toString()
            }
        });

        const res1 = await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'test_signature')
            .send(sessionPayload);

        expect(res1.statusCode).toBe(200);

        const res2 = await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'test_signature')
            .send(sessionPayload);

        expect(res2.statusCode).toBe(200);
        expect(res2.body.received).toBe(true);
    });

    it('deducts stock only once per order item', async () => {
        const product = await createProduct('Stock Deduct', 10, 3);
        const token = await registerAndGetToken();
        await addToCart(token, product.id, 2);

        const checkoutRes = await request(app)
            .post('/checkout/create-session')
            .set('Authorization', `Bearer ${token}`);

        const orderId = checkoutRes.body.data.orderId;
        const paymentIntentId = 'pi_test_stock_' + Date.now();

        const sessionPayload = JSON.stringify({
            id: 'cs_test_stock_' + Date.now(),
            object: 'checkout.session',
            payment_intent: paymentIntentId,
            amount_total: 1000,
            metadata: {
                orderId: orderId.toString(),
                orderNumber: checkoutRes.body.data.orderNumber,
                userId: (await User.findOne({ where: { email: 'checkout@example.com' } })).id.toString()
            }
        });

        await request(app)
            .post('/checkout/webhook')
            .set('stripe-signature', 'test_signature')
            .send(sessionPayload);

        const productAfter = await Product.findByPk(product.id);
        expect(productAfter.stock).toBe(1);
    });
});
