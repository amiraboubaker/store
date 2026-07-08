const { Op } = require('sequelize');

class ProductService {
    constructor(Product) {
        this.Product = Product;
    }

    static slugify(value) {
        return String(value)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    static validateProductPayload(payload) {
        const normalized = {
            name: typeof payload.name === 'string' ? payload.name.trim() : '',
            price: Number(payload.price),
            category: typeof payload.category === 'string' ? payload.category.trim() : '',
            material: typeof payload.material === 'string' ? payload.material.trim() : 'unspecified',
            stock: Number(payload.stock),
            description: typeof payload.description === 'string' ? payload.description.trim() : '',
            images: Array.isArray(payload.images) ? payload.images.filter(Boolean) : []
        };

        if (!normalized.name) {
            throw new Error('name is required');
        }

        if (!Number.isFinite(normalized.price) || normalized.price <= 0) {
            throw new Error('price must be greater than 0');
        }

        if (!normalized.category) {
            throw new Error('category is required');
        }

        if (!Number.isInteger(normalized.stock) || normalized.stock < 0) {
            throw new Error('stock must be greater than or equal to 0');
        }

        if (!normalized.description) {
            throw new Error('description is required');
        }

        return {
            ...normalized,
            price: Number(normalized.price.toFixed(2)),
            slug: ProductService.slugify(normalized.name)
        };
    }

    async listProducts({ page = 1, limit = 10, category, material, minPrice, maxPrice } = {}) {
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));
        const offset = (pageNumber - 1) * pageSize;

        const where = {};
        if (category) where.category = category;
        if (material) where.material = material;

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price[Op.gte] = Number(minPrice);
            if (maxPrice !== undefined) where.price[Op.lte] = Number(maxPrice);
        }

        const products = await this.Product.findAll({
            where,
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const total = await this.Product.count({ where });

        return {
            items: products,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        };
    }

    async createProduct(input) {
        const normalized = ProductService.validateProductPayload(input);
        const existing = await this.Product.findOne({ where: { slug: normalized.slug } });
        const slug = existing ? `${normalized.slug}-${Date.now()}` : normalized.slug;
        return this.Product.create({ ...normalized, slug });
    }

    async getProductById(id) {
        return this.Product.findByPk(id);
    }

    async updateProduct(id, input) {
        const product = await this.Product.findByPk(id);
        if (!product) return null;

        const normalized = ProductService.validateProductPayload({
            ...product.toJSON(),
            ...input
        });

        if (normalized.name && normalized.name !== product.name) {
            normalized.slug = ProductService.slugify(normalized.name);
        }

        await product.update(normalized);
        return product;
    }

    async deleteProduct(id) {
        const product = await this.Product.findByPk(id);
        if (!product) return false;
        await product.destroy();
        return true;
    }
}

module.exports = ProductService;
