class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }

    /* ----------------------------- Dashboard ----------------------------- */

    async getDashboard(req, res, next) {
        try {
            const [metrics, dailySales] = await Promise.all([
                this.adminService.getMetrics(),
                this.adminService.getDailySales(7)
            ]);

            res.status(200).json({
                status: 'success',
                code: 'ADMIN_DASHBOARD_RETRIEVED',
                message: 'Dashboard data retrieved successfully',
                data: { metrics, dailySales }
            });
        } catch (error) {
            next(error);
        }
    }

    async getDailySales(req, res, next) {
        try {
            const days = Number(req.query.days) || 7;
            const dailySales = await this.adminService.getDailySales(days);
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_DAILY_SALES_RETRIEVED',
                message: 'Daily sales retrieved successfully',
                data: { dailySales }
            });
        } catch (error) {
            next(error);
        }
    }

    /* ----------------------------- Products ------------------------------ */

    async listProducts(req, res, next) {
        try {
            const result = await this.adminService.listProducts(req.query);
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_PRODUCTS_RETRIEVED',
                message: 'Products retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req, res, next) {
        try {
            const product = await this.adminService.createProduct(req.body);
            res.status(201).json({
                status: 'success',
                code: 'ADMIN_PRODUCT_CREATED',
                message: 'Product created successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProduct(req, res, next) {
        try {
            const product = await this.adminService.getProduct(req.params.id);
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_PRODUCT_RETRIEVED',
                message: 'Product retrieved successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req, res, next) {
        try {
            const product = await this.adminService.updateProduct(req.params.id, req.body);
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_PRODUCT_UPDATED',
                message: 'Product updated successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const deleted = await this.adminService.deleteProduct(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_PRODUCT_DELETED',
                message: 'Product deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    /* ------------------------------ Orders ------------------------------- */

    async listOrders(req, res, next) {
        try {
            const result = await this.adminService.listOrders(req.query);
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_ORDERS_RETRIEVED',
                message: 'Orders retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrder(req, res, next) {
        try {
            const order = await this.adminService.getOrder(req.params.id);
            if (!order) {
                return res.status(404).json({
                    status: 'error',
                    code: 'ORDER_NOT_FOUND',
                    message: 'Order not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_ORDER_RETRIEVED',
                message: 'Order retrieved successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const result = await this.adminService.updateOrderStatus(
                req.params.id,
                req.body.status,
                req.body.notes
            );
            if (!result) {
                return res.status(404).json({
                    status: 'error',
                    code: 'ORDER_NOT_FOUND',
                    message: 'Order not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_ORDER_UPDATED',
                message: 'Order status updated successfully',
                data: { order: result.order }
            });
        } catch (error) {
            next(error);
        }
    }

    /* ------------------------------ Users -------------------------------- */

    async listUsers(req, res, next) {
        try {
            const result = await this.adminService.listUsers(req.query);
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_USERS_RETRIEVED',
                message: 'Users retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getUser(req, res, next) {
        try {
            const user = await this.adminService.getUser(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_USER_RETRIEVED',
                message: 'User retrieved successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req, res, next) {
        try {
            const user = await this.adminService.updateUserRole(req.params.id, req.body.role);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_USER_ROLE_UPDATED',
                message: 'User role updated successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req, res, next) {
        try {
            const user = await this.adminService.updateUserStatus(req.params.id, req.body.isActive);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_USER_STATUS_UPDATED',
                message: 'User status updated successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const deleted = await this.adminService.deleteUser(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_USER_DELETED',
                message: 'User deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    /* ----------------------------- Activity ------------------------------ */

    async listLogs(req, res, next) {
        try {
            const result = await this.adminService.listLogs(req.query);
            res.status(200).json({
                status: 'success',
                code: 'ADMIN_LOGS_RETRIEVED',
                message: 'Activity logs retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;
