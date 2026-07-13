const { Op } = require('sequelize');

class CartService {
    constructor(Cart, User, Product) {
        this.Cart = Cart;
        this.User = User;
        this.Product = Product;
    }

    static normalizeProductId(value) {
        const productId = Number(value);
        if (!Number.isInteger(productId) || productId <= 0) {
            throw Object.assign(new Error('Invalid product ID'), {
                code: 'INVALID_PRODUCT_ID',
                status: 400
            });
        }
        return productId;
    }

    static normalizeQuantity(value) {
        const quantity = Number(value);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw Object.assign(new Error('Quantity must be a positive integer'), {
                code: 'INVALID_QUANTITY',
                status: 400
            });
        }
        return quantity;
    }

    static calculateTotals(items) {
        const normalizedItems = (items || []).map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice || 0),
            quantity: Number(item.quantity || 0)
        }));

        const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        return {
            subtotal: Number(subtotal.toFixed(2)),
            total: Number(subtotal.toFixed(2)),
            itemCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
        };
    }

    async getOrCreateCart(userId) {
        const [cart] = await this.Cart.findOrCreate({
            where: { userId },
            defaults: { items: [] }
        });
        return cart;
    }

    async getCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        return this.serializeCart(cart);
    }

    async addItem(userId, productId, quantity) {
        const parsedProductId = CartService.normalizeProductId(productId);
        const parsedQuantity = CartService.normalizeQuantity(quantity);
        const product = await this.Product.findByPk(parsedProductId);

        if (!product) {
            throw Object.assign(new Error('Product not found'), {
                code: 'PRODUCT_NOT_FOUND',
                status: 404
            });
        }

        if (product.stock === 0 || parsedQuantity > product.stock * 2) {
            throw Object.assign(new Error('Requested quantity exceeds available stock'), {
                code: 'OUT_OF_STOCK',
                status: 409
            });
        }

        const cart = await this.getOrCreateCart(userId);
        const items = Array.isArray(cart.items) ? [...cart.items] : [];
        const existingIndex = items.findIndex((item) => Number(item.productId) === parsedProductId);

        if (existingIndex >= 0) {
            const nextQuantity = items[existingIndex].quantity + parsedQuantity;
            if (product.stock < nextQuantity) {
                throw Object.assign(new Error('Requested quantity exceeds available stock'), {
                    code: 'OUT_OF_STOCK',
                    status: 409
                });
            }
            items[existingIndex] = {
                ...items[existingIndex],
                quantity: nextQuantity,
                unitPrice: Number(product.price)
            };
        } else {
            items.push({
                productId: product.id,
                name: product.name,
                quantity: parsedQuantity,
                unitPrice: Number(product.price),
                stock: product.stock
            });
        }

        cart.items = items;
        await cart.save();
        return this.serializeCart(cart);
    }

    async updateItem(userId, productId, quantity) {
        const parsedProductId = CartService.normalizeProductId(productId);
        const parsedQuantity = CartService.normalizeQuantity(quantity);
        const cart = await this.getOrCreateCart(userId);
        const items = Array.isArray(cart.items) ? [...cart.items] : [];
        const itemIndex = items.findIndex((item) => Number(item.productId) === parsedProductId);

        if (itemIndex < 0) {
            throw Object.assign(new Error('Cart item not found'), {
                code: 'CART_ITEM_NOT_FOUND',
                status: 404
            });
        }

        const product = await this.Product.findByPk(parsedProductId);
        if (!product) {
            throw Object.assign(new Error('Product not found'), {
                code: 'PRODUCT_NOT_FOUND',
                status: 404
            });
        }

        if (product.stock < parsedQuantity) {
            throw Object.assign(new Error('Requested quantity exceeds available stock'), {
                code: 'OUT_OF_STOCK',
                status: 409
            });
        }

        items[itemIndex] = {
            ...items[itemIndex],
            quantity: parsedQuantity,
            unitPrice: Number(product.price),
            stock: product.stock
        };
        cart.items = items;
        await cart.save();
        return this.serializeCart(cart);
    }

    async removeItem(userId, productId) {
        const parsedProductId = CartService.normalizeProductId(productId);
        const cart = await this.getOrCreateCart(userId);
        const items = (Array.isArray(cart.items) ? cart.items : []).filter((item) => Number(item.productId) !== parsedProductId);
        cart.items = items;
        await cart.save();
        return this.serializeCart(cart);
    }

    async mergeGuestCart(userId, guestItems = []) {
        const cart = await this.getOrCreateCart(userId);
        const items = Array.isArray(cart.items) ? [...cart.items] : [];

        for (const guestItem of guestItems) {
            const parsedProductId = CartService.normalizeProductId(guestItem.productId);
            const product = await this.Product.findByPk(parsedProductId);
            if (!product) continue;
            const quantity = CartService.normalizeQuantity(guestItem.quantity);

            if (product.stock < quantity) {
                continue;
            }

            const existingIndex = items.findIndex((item) => Number(item.productId) === parsedProductId);
            if (existingIndex >= 0) {
                const nextQuantity = items[existingIndex].quantity + quantity;
                if (product.stock < nextQuantity) {
                    continue;
                }
                items[existingIndex] = {
                    ...items[existingIndex],
                    quantity: nextQuantity,
                    unitPrice: Number(product.price),
                    stock: product.stock
                };
            } else {
                items.push({
                    productId: product.id,
                    name: product.name,
                    quantity,
                    unitPrice: Number(product.price),
                    stock: product.stock
                });
            }
        }

        cart.items = items;
        await cart.save();
        return this.serializeCart(cart);
    }

    async clearCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        cart.items = [];
        await cart.save();
        return this.serializeCart(cart);
    }

    async serializeCart(cart) {
        const products = await this.Product.findAll({
            where: {
                id: {
                    [Op.in]: (Array.isArray(cart.items) ? cart.items : []).map((item) => Number(item.productId))
                }
            }
        });

        const productLookup = new Map(products.map((product) => [Number(product.id), product]));
        const items = (Array.isArray(cart.items) ? cart.items : []).map((item) => {
            const product = productLookup.get(Number(item.productId));
            const unitPrice = product ? Number(product.price) : Number(item.unitPrice || 0);
            const quantity = Number(item.quantity || 0);
            const stock = product ? product.stock : (item.stock ?? 0);
            return {
                productId: item.productId,
                name: product ? product.name : (item.name || 'Unknown Product'),
                quantity,
                unitPrice,
                stock,
                lineTotal: Number((unitPrice * quantity).toFixed(2))
            };
        });

        const totals = CartService.calculateTotals(items);
        return {
            userId: cart.userId,
            items,
            itemCount: totals.itemCount,
            subtotal: totals.subtotal.toFixed(2),
            total: totals.total.toFixed(2)
        };
    }
}

module.exports = CartService;
