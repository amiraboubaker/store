// src/tests/admin.test.js
// Jest test suite for the role-restricted admin dashboard API.

const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Admin Dashboard API', () => {
    let User;
    let Product;
    let Order;
    let sequelize;
    let adminToken;
    let customerToken;
    let createdProductId;

    const registerAndLogin = async (userData) => {
        const reg = await request(app).post('/auth/register').send({
            ...userData,
            confirmPassword: userData.password
        });
        if (reg.statusCode !== 201) return null;
        const login = await request(app)
            .post('/auth/login')
            .send({ email: userData.email, password: userData.password });
        return login.body.data.token;
    };

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        User = bootstrapped.User;
        Product = bootstrapped.Product;
        Order = bootstrapped.Order;
        sequelize = bootstrapped.sequelize;

        await User.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await Order.destroy({ where: {} });

        // Seed an admin directly (mirrors ADMIN_EMAIL bootstrap path)
        await User.create({
            firstName: 'Admin',
            lastName: 'One',
            email: 'admin@example.com',
            password: 'AdminPass123!',
            role: 'admin'
        });
        const adminLogin = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@example.com', password: 'AdminPass123!' });
        adminToken = adminLogin.body.data.token;

        customerToken = await registerAndLogin({
            firstName: 'Cust',
            lastName: 'Omer',
            email: 'customer@example.com',
            password: 'CustomerPass123!'
        });
    });

    afterAll(async () => {
        if (sequelize) await sequelize.close();
    });

    describe('Role protection', () => {
        it('blocks unauthenticated requests', async () => {
            const res = await request(app).get('/admin/dashboard');
            expect(res.statusCode).toBe(401);
        });

        it('blocks non-admin (customer) requests', async () => {
            const res = await request(app)
                .get('/admin/dashboard')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('allows admin requests', async () => {
            const res = await request(app)
                .get('/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Products CRUD', () => {
        it('creates a product (admin only)', async () => {
            const res = await request(app)
                .post('/admin/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Silk Fabric',
                    category: 'fabric',
                    material: 'silk',
                    price: 19.99,
                    stock: 50,
                    description: 'Premium silk fabric'
                });
            expect(res.statusCode).toBe(201);
            createdProductId = res.body.data.product.id;
        });

        it('rejects product creation by customer', async () => {
            const res = await request(app)
                .post('/admin/products')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ name: 'x', category: 'y', price: 1, stock: 1, description: 'z' });
            expect(res.statusCode).toBe(403);
        });

        it('lists products', async () => {
            const res = await request(app)
                .get('/admin/products')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThan(0);
        });

        it('updates a product', async () => {
            const res = await request(app)
                .put(`/admin/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Silk Fabric',
                    category: 'fabric',
                    material: 'silk',
                    price: 24.99,
                    stock: 40,
                    description: 'Premium silk fabric'
                });
            expect(res.statusCode).toBe(200);
            expect(Number(res.body.data.product.price)).toBe(24.99);
        });

        it('deletes a product', async () => {
            const res = await request(app)
                .delete(`/admin/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Orders', () => {
        let orderId;
        beforeAll(async () => {
            const user = await User.findOne({ where: { email: 'customer@example.com' } });
            const order = await Order.create({
                userId: user.id,
                status: 'pending',
                subtotal: 10,
                total: 10,
                currency: 'USD'
            });
            orderId = order.id;
        });

        it('lists orders', async () => {
            const res = await request(app)
                .get('/admin/orders')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThan(0);
        });

        it('updates order status', async () => {
            const res = await request(app)
                .patch(`/admin/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'paid' });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.order.status).toBe('paid');
        });

        it('rejects invalid order status', async () => {
            const res = await request(app)
                .patch(`/admin/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'bogus' });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('Users', () => {
        it('lists users', async () => {
            const res = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
        });

        it('promotes a user to admin', async () => {
            const list = await request(app)
                .get('/admin/users?search=customer@example.com')
                .set('Authorization', `Bearer ${adminToken}`);
            const userId = list.body.data.items[0].id;
            const res = await request(app)
                .patch(`/admin/users/${userId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'admin' });
            expect(res.statusCode).toBe(200);
            expect(res.body.data.user.role).toBe('admin');
        });
    });

    describe('Analytics', () => {
        it('returns daily sales', async () => {
            const res = await request(app)
                .get('/admin/analytics/daily-sales')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data.dailySales)).toBe(true);
        });
    });

    describe('Activity log', () => {
        it('records admin actions', async () => {
            const res = await request(app)
                .get('/admin/logs')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThan(0);
        });
    });
});
