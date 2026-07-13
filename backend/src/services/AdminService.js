const { Op } = require('sequelize');
const ProductService = require('./ProductService');

class AdminService {
    constructor(models) {
        this.User = models.User;
        this.Product = models.Product;
        this.Order = models.Order;
        this.OrderItem = models.OrderItem;
        this.AdminActionLog = models.AdminActionLog;
        this.productService = new ProductService(models.Product);
    }

    /* ------------------------------------------------------------------ */
    /* Products (delegates to existing ProductService)                    */
    /* ------------------------------------------------------------------ */

    listProducts(query) {
        return this.productService.listProducts(query);
    }

    createProduct(input, actor) {
        return this.productService.createProduct(input);
    }

    getProduct(id) {
        return this.productService.getProductById(id);
    }

    updateProduct(id, input) {
        return this.productService.updateProduct(id, input);
    }

    deleteProduct(id) {
        return this.productService.deleteProduct(id);
    }

    /* ------------------------------------------------------------------ */
    /* Orders                                                             */
    /* ------------------------------------------------------------------ */

    async listOrders({ page = 1, limit = 20, status, userId } = {}) {
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
        const offset = (pageNumber - 1) * pageSize;

        const where = {};
        if (status) where.status = status;
        if (userId) where.userId = userId;

        const orders = await this.Order.findAll({
            where,
            include: [
                { model: this.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: this.OrderItem, as: 'items' }
            ],
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const total = await this.Order.count({ where });

        return {
            items: orders,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        };
    }

    async getOrder(id) {
        return this.Order.findByPk(id, {
            include: [
                { model: this.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: this.OrderItem, as: 'items' }
            ]
        });
    }

    async updateOrderStatus(id, status, notes) {
        const order = await this.Order.findByPk(id);
        if (!order) return null;

        const allowed = ['pending', 'paid', 'shipped', 'canceled'];
        if (!allowed.includes(status)) {
            throw { code: 'INVALID_STATUS', message: 'Invalid order status', status: 400 };
        }

        const previousStatus = order.status;
        const payload = { status };
        if (notes !== undefined) payload.notes = notes;

        if (status === 'shipped' && !order.shippedAt) payload.shippedAt = new Date();
        if (status === 'paid' && !order.paidAt) payload.paidAt = new Date();
        if (status === 'canceled' && !order.canceledAt) payload.canceledAt = new Date();

        await order.update(payload);

        return { order, previousStatus };
    }

    /* ------------------------------------------------------------------ */
    /* Users                                                              */
    /* ------------------------------------------------------------------ */

    async listUsers({ page = 1, limit = 20, role, search } = {}) {
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
        const offset = (pageNumber - 1) * pageSize;

        const where = {};
        if (role) where.role = role;
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const users = await this.User.findAndCountAll({
            where,
            attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            items: users.rows,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total: users.count,
                pages: Math.ceil(users.count / pageSize)
            }
        };
    }

    async getUser(id) {
        return this.User.findByPk(id, {
            attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
        });
    }

    async updateUserRole(id, role) {
        const user = await this.User.findByPk(id);
        if (!user) return null;

        const allowed = ['customer', 'admin'];
        if (!allowed.includes(role)) {
            throw { code: 'INVALID_ROLE', message: 'Invalid user role', status: 400 };
        }

        await user.update({ role });
        return user;
    }

    async updateUserStatus(id, isActive) {
        const user = await this.User.findByPk(id);
        if (!user) return null;

        await user.update({ isActive: !!isActive });
        return user;
    }

    async deleteUser(id) {
        const user = await this.User.findByPk(id);
        if (!user) return false;
        await user.destroy();
        return true;
    }

    /* ------------------------------------------------------------------ */
    /* Analytics                                                          */
    /* ------------------------------------------------------------------ */

    async getMetrics() {
        const totalOrders = await this.Order.count();
        const totalUsers = await this.User.count();
        const totalProducts = await this.Product.count();

        const revenueResult = await this.Order.findAll({
            attributes: [
                [this.Order.sequelize.fn('SUM', this.Order.sequelize.col('total')), 'revenue'],
                [this.Order.sequelize.fn('COUNT', this.Order.sequelize.col('id')), 'paidOrders']
            ],
            where: { status: { [Op.in]: ['paid', 'shipped'] } },
            raw: true
        });

        const revenue = Number(revenueResult[0]?.revenue) || 0;
        const paidOrders = Number(revenueResult[0]?.paidOrders) || 0;

        const byStatus = await this.Order.findAll({
            attributes: [
                'status',
                [this.Order.sequelize.fn('COUNT', this.Order.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const ordersByStatus = byStatus.reduce((acc, row) => {
            acc[row.status] = Number(row.count);
            return acc;
        }, {});

        const avgOrderValue = paidOrders > 0 ? revenue / paidOrders : 0;

        return {
            totalOrders,
            totalUsers,
            totalProducts,
            totalRevenue: revenue,
            paidOrders,
            avgOrderValue,
            ordersByStatus
        };
    }

    async getDailySales(days = 7) {
        const dayCount = Math.min(30, Math.max(1, Number(days) || 7));
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (dayCount - 1));

        const orders = await this.Order.findAll({
            where: {
                createdAt: { [Op.gte]: since },
                status: { [Op.in]: ['paid', 'shipped'] }
            },
            attributes: ['id', 'total', 'createdAt', 'status'],
            raw: true
        });

        const buckets = {};
        for (let i = 0; i < dayCount; i += 1) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            buckets[d.toISOString().slice(0, 10)] = { date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 };
        }

        orders.forEach((order) => {
            const key = new Date(order.createdAt).toISOString().slice(0, 10);
            if (buckets[key]) {
                buckets[key].orders += 1;
                buckets[key].revenue = Number(buckets[key].revenue) + Number(order.total);
            }
        });

        return Object.values(buckets).map((b) => ({ ...b, revenue: Number(b.revenue.toFixed(2)) }));
    }

    /* ------------------------------------------------------------------ */
    /* Action logging                                                     */
    /* ------------------------------------------------------------------ */

    async logAction({ admin, action, entity, entityId, details, req }) {
        try {
            await this.AdminActionLog.create({
                adminId: admin?.id,
                adminEmail: admin?.email,
                action,
                entity,
                entityId,
                details: details || {},
                ip: req?.ip || req?.headers?.['x-forwarded-for'] || null
            });
        } catch (error) {
            console.error('Failed to write admin action log:', error.message);
        }
    }

    async listLogs({ page = 1, limit = 50, entity, adminId } = {}) {
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(200, Math.max(1, Number(limit) || 50));
        const offset = (pageNumber - 1) * pageSize;

        const where = {};
        if (entity) where.entity = entity;
        if (adminId) where.adminId = adminId;

        const logs = await this.AdminActionLog.findAndCountAll({
            where,
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            items: logs.rows,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total: logs.count,
                pages: Math.ceil(logs.count / pageSize)
            }
        };
    }
}

module.exports = AdminService;
