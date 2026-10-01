const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Products endpoint', () => {
    let Product;
    let sequelize;

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        Product = bootstrapped.Product;
        sequelize = bootstrapped.sequelize;
    });

    afterAll(async () => {
        await Product.destroy({ where: {}, truncate: true });
        await sequelize.close();
    });

    const sampleProduct = {
        name: 'Silk Thread',
        slug: 'silk-thread',
        category: 'Embroidery',
        material: 'Silk',
        price: 12.5,
        stock: 10,
        description: 'Premium silk thread',
        images: ['https://cdn.example.com/thread.jpg']
    };

    it('creates a product', async () => {
        const res = await request(app).post('/products').send(sampleProduct);

        expect(res.status).toBe(201);
        expect(res.body.data.product.name).toBe('Silk Thread');
        expect(Number(res.body.data.product.price)).toBe(12.5);
    });

    it('rejects a product with a non positive price', async () => {
        const res = await request(app)
            .post('/products')
            .send({ ...sampleProduct, price: 0 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a product with negative stock', async () => {
        const res = await request(app)
            .post('/products')
            .send({ ...sampleProduct, stock: -1 });

        expect(res.status).toBe(400);
    });

    it('lists products with pagination metadata', async () => {
        const res = await request(app).get('/products?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(res.body.code).toBe('PRODUCTS_RETRIEVED');
        expect(Array.isArray(res.body.data.items)).toBe(true);
        expect(res.body.data.pagination).toHaveProperty('total');
    });

    it('filters products by category', async () => {
        await request(app).post('/products').send({
            ...sampleProduct,
            name: 'Linen Fabric',
            slug: 'linen-fabric',
            category: 'Fabric'
        });

        const res = await request(app).get('/products?category=Fabric');

        expect(res.status).toBe(200);
        res.body.data.items.forEach((item) => {
            expect(item.category).toBe('Fabric');
        });
    });

    it('returns a single product by id', async () => {
        const created = await request(app).post('/products').send({
            ...sampleProduct,
            name: 'Wool Batting',
            slug: 'wool-batting'
        });

        const res = await request(app).get(`/products/${created.body.data.product.id}`);

        expect(res.status).toBe(200);
        expect(res.body.data.product.name).toBe('Wool Batting');
    });

    it('returns 404 for a product that does not exist', async () => {
        const res = await request(app).get('/products/99999999');

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('updates a product', async () => {
        const created = await request(app).post('/products').send({
            ...sampleProduct,
            name: 'Beaded Trim',
            slug: 'beaded-trim'
        });

        const id = created.body.data.product.id;
        const res = await request(app)
            .put(`/products/${id}`)
            .send({ ...sampleProduct, name: 'Beaded Trim Gold', slug: 'beaded-trim', price: 19.99 });

        expect(res.status).toBe(200);
        expect(res.body.data.product.name).toBe('Beaded Trim Gold');
        expect(Number(res.body.data.product.price)).toBe(19.99);
    });

    it('deletes a product', async () => {
        const created = await request(app).post('/products').send({
            ...sampleProduct,
            name: 'Disposable Needle',
            slug: 'disposable-needle'
        });

        const id = created.body.data.product.id;
        const res = await request(app).delete(`/products/${id}`);

        expect(res.status).toBe(200);
        expect(res.body.code).toBe('PRODUCT_DELETED');
        expect(await Product.findByPk(id)).toBeNull();
    });
});