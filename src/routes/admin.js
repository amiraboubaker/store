const express = require('express');
const { createAuthMiddleware, roleMiddleware } = require('../middleware/auth');
const { createAdminLogger } = require('../middleware/adminLogger');
const {
    validateProductCreation,
    validateProductQuery,
    handleProductValidationErrors
} = require('../middleware/productValidation');
const {
    validateUserRoleUpdate,
    validateUserStatusUpdate,
    validateOrderStatusUpdate,
    handleAdminValidationErrors
} = require('../middleware/adminValidation');
const AdminController = require('../controllers/AdminController');
const AdminService = require('../services/AdminService');

module.exports = (models) => {
    const router = express.Router();

    const { User, Product, Order, OrderItem, AdminActionLog } = models;
    const { authMiddleware } = createAuthMiddleware(User);

    const adminService = new AdminService({ User, Product, Order, OrderItem, AdminActionLog });
    const adminController = new AdminController(adminService);
    const log = createAdminLogger(adminService);

    // Lock down every route in this router to authenticated admins only.
    router.use(authMiddleware, roleMiddleware(['admin']));

    /* --------------------------- Analytics ----------------------------- */
    router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
    router.get('/analytics/daily-sales', (req, res, next) => adminController.getDailySales(req, res, next));

    /* ---------------------------- Products ----------------------------- */
    router.get(
        '/products',
        validateProductQuery,
        handleProductValidationErrors,
        (req, res, next) => adminController.listProducts(req, res, next)
    );
    router.get('/products/:id', (req, res, next) => adminController.getProduct(req, res, next));
    router.post(
        '/products',
        validateProductCreation,
        handleProductValidationErrors,
        log('create', 'product', (req) => req.body?.id),
        (req, res, next) => adminController.createProduct(req, res, next)
    );
    router.put(
        '/products/:id',
        validateProductCreation,
        handleProductValidationErrors,
        log('update', 'product', (req) => Number(req.params.id)),
        (req, res, next) => adminController.updateProduct(req, res, next)
    );
    router.delete(
        '/products/:id',
        log('delete', 'product', (req) => Number(req.params.id)),
        (req, res, next) => adminController.deleteProduct(req, res, next)
    );

    /* ----------------------------- Orders ------------------------------ */
    router.get('/orders', (req, res, next) => adminController.listOrders(req, res, next));
    router.get('/orders/:id', (req, res, next) => adminController.getOrder(req, res, next));
    router.patch(
        '/orders/:id/status',
        validateOrderStatusUpdate,
        handleAdminValidationErrors,
        log('update', 'order', (req) => Number(req.params.id)),
        (req, res, next) => adminController.updateOrderStatus(req, res, next)
    );

    /* ------------------------------ Users ------------------------------ */
    router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
    router.get('/users/:id', (req, res, next) => adminController.getUser(req, res, next));
    router.patch(
        '/users/:id/role',
        validateUserRoleUpdate,
        handleAdminValidationErrors,
        log('update', 'user', (req) => Number(req.params.id)),
        (req, res, next) => adminController.updateUserRole(req, res, next)
    );
    router.patch(
        '/users/:id/status',
        validateUserStatusUpdate,
        handleAdminValidationErrors,
        log('update', 'user', (req) => Number(req.params.id)),
        (req, res, next) => adminController.updateUserStatus(req, res, next)
    );
    router.delete(
        '/users/:id',
        log('delete', 'user', (req) => Number(req.params.id)),
        (req, res, next) => adminController.deleteUser(req, res, next)
    );

    /* --------------------------- Activity ------------------------------ */
    router.get('/logs', (req, res, next) => adminController.listLogs(req, res, next));

    return router;
};
