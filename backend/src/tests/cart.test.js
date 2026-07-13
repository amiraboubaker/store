const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Cart API', () => {
    let User;
    let Product;
    let Cart;
    let sequelize;

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        User = bootstrapped.User;
        Product = bootstrapped.Product;
        Cart = bootstrapped.Cart;
        sequelize = bootstrapped.sequelize;
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        if (sequelize) {
            await sequelize.close();
        }
    });

    beforeEach(async () => {
        await Cart.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    it('adds, updates, and removes cart items with server-side totals', async () => {
        const product = await Product.create({
            name: 'Silk Ribbon',
            slug: 'silk-ribbon',
            category: 'Accessories',
            price: 12.5,
            stock: 8,
            description: 'Premium silk ribbon',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Cart',
                lastName: 'User',
                email: 'cart@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        const addRes = await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 2 });

        expect(addRes.statusCode).toBe(201);
        expect(addRes.body.data.items).toHaveLength(1);
        expect(addRes.body.data.subtotal).toBe('25.00');
        expect(addRes.body.data.total).toBe('25.00');

        const updateRes = await request(app)
            .put(`/cart/items/${product.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 3 });

        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.data.items[0].quantity).toBe(3);
        expect(updateRes.body.data.subtotal).toBe('37.50');
        expect(updateRes.body.data.total).toBe('37.50');

        const removeRes = await request(app)
            .delete(`/cart/items/${product.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(removeRes.statusCode).toBe(200);
        expect(removeRes.body.data.items).toEqual([]);
    });

    it('rejects invalid quantities and stock shortages', async () => {
        const product = await Product.create({
            name: 'Beading Thread',
            slug: 'beading-thread',
            category: 'Accessories',
            price: 7.25,
            stock: 2,
            description: 'Beading thread',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Stock',
                lastName: 'User',
                email: 'stock@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        const invalidQtyRes = await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 0 });

        expect(invalidQtyRes.statusCode).toBe(400);
        expect(invalidQtyRes.body.code).toBe('INVALID_QUANTITY');

        const outOfStockRes = await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 5 });

        expect(outOfStockRes.statusCode).toBe(409);
        expect(outOfStockRes.body.code).toBe('OUT_OF_STOCK');
    });

    it('merges a guest cart into the user cart after login', async () => {
        const product = await Product.create({
            name: 'Embroidery Hoop',
            slug: 'embroidery-hoop',
            category: 'Tools',
            price: 15,
            stock: 10,
            description: 'Embroidery hoop',
            images: []
        });

        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'does-not-exist@example.com',
                password: 'SecurePass123!'
            });

        expect(loginRes.statusCode).toBe(401);

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Guest',
                lastName: 'User',
                email: 'guest@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;
        const mergeRes = await request(app)
            .post('/auth/login')
            .set('Authorization', `Bearer ${token}`)
            .send({
                email: 'guest@example.com',
                password: 'SecurePass123!',
                guestCart: [{ productId: product.id, quantity: 2 }]
            });

        expect(mergeRes.statusCode).toBe(200);
        expect(mergeRes.body.data.cart.items).toHaveLength(1);
        expect(mergeRes.body.data.cart.items[0].quantity).toBe(2);
    });

    it('deduplicates when adding the same product twice', async () => {
        const product = await Product.create({
            name: 'Dedup Test',
            slug: 'dedup-test',
            category: 'Test',
            price: 10,
            stock: 10,
            description: 'Test product',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Dedup',
                lastName: 'User',
                email: 'dedup@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 2 });

        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 3 });

        const cartRes = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(cartRes.statusCode).toBe(200);
        expect(cartRes.body.data.items).toHaveLength(1);
        expect(cartRes.body.data.items[0].quantity).toBe(5);
        expect(cartRes.body.data.subtotal).toBe('50.00');
    });

    it('skips out-of-stock guest items during merge', async () => {
        const inStock = await Product.create({
            name: 'In Stock Item',
            slug: 'in-stock-item',
            category: 'Test',
            price: 10,
            stock: 10,
            description: 'In stock',
            images: []
        });

        const outOfStock = await Product.create({
            name: 'Out of Stock Item',
            slug: 'out-of-stock-item',
            category: 'Test',
            price: 20,
            stock: 1,
            description: 'Out of stock',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Merge',
                lastName: 'User',
                email: 'merge@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;
        const mergeRes = await request(app)
            .post('/auth/login')
            .set('Authorization', `Bearer ${token}`)
            .send({
                email: 'merge@example.com',
                password: 'SecurePass123!',
                guestCart: [
                    { productId: inStock.id, quantity: 2 },
                    { productId: outOfStock.id, quantity: 5 }
                ]
            });

        expect(mergeRes.statusCode).toBe(200);
        expect(mergeRes.body.data.cart.items).toHaveLength(1);
        expect(mergeRes.body.data.cart.items[0].productId).toBe(inStock.id);
    });

    it('returns 404 when updating or adding a non-existent product', async () => {
        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Missing',
                lastName: 'Product',
                email: 'missing@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        const addRes = await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 9999, quantity: 1 });

        expect(addRes.statusCode).toBe(404);
        expect(addRes.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('rejects quantity updates that exceed stock', async () => {
        const product = await Product.create({
            name: 'Stock Limit',
            slug: 'stock-limit',
            category: 'Test',
            price: 10,
            stock: 2,
            description: 'Limited stock',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Stock',
                lastName: 'User',
                email: 'stock2@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 1 });

        const updateRes = await request(app)
            .put(`/cart/items/${product.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 5 });

        expect(updateRes.statusCode).toBe(409);
        expect(updateRes.body.code).toBe('OUT_OF_STOCK');
    });

    it('returns an empty cart for a new user', async () => {
        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Empty',
                lastName: 'Cart',
                email: 'empty@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        const cartRes = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(cartRes.statusCode).toBe(200);
        expect(cartRes.body.data.items).toEqual([]);
        expect(cartRes.body.data.subtotal).toBe('0.00');
    });

    it('clears the cart successfully', async () => {
        const product = await Product.create({
            name: 'Clear Test',
            slug: 'clear-test',
            category: 'Test',
            price: 5,
            stock: 10,
            description: 'Clear test',
            images: []
        });

        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                firstName: 'Clear',
                lastName: 'User',
                email: 'clear@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!'
            });

        const token = registerRes.body.data.token;

        await request(app)
            .post('/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 2 });

        const clearRes = await request(app)
            .delete('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(clearRes.statusCode).toBe(200);
        expect(clearRes.body.data.items).toEqual([]);
        expect(clearRes.body.data.subtotal).toBe('0.00');
    });
});
