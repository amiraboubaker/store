const express = require('express');
const { createAuthMiddleware, roleMiddleware } = require('../middleware/auth');

module.exports = (User) => {
    const router = express.Router();
    const { authMiddleware } = createAuthMiddleware(User);

/**
 * Example Protected Routes - Admin Only
 */

/**
 * GET /admin/users
 * Retrieve all users (admin only)
 */
router.get(
    '/users',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        // Implementation would query database for all users
        res.status(200).json({
            status: 'success',
            code: 'USERS_RETRIEVED',
            message: 'Users retrieved successfully',
            data: {
                users: [
                    // Database results would go here
                ]
            }
        });
    }
);

/**
 * DELETE /admin/users/:id
 * Delete user (admin only)
 */
router.delete(
    '/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        // Implementation would delete user from database
        res.status(200).json({
            status: 'success',
            code: 'USER_DELETED',
            message: 'User deleted successfully',
            data: null
        });
    }
);

/**
 * PUT /admin/users/:id/role
 * Update user role (admin only)
 */
router.put(
    '/users/:id/role',
    authMiddleware,
    roleMiddleware(['admin']),
    (req, res) => {
        // Implementation would update user role
        const { role } = req.body;
        res.status(200).json({
            status: 'success',
            code: 'USER_ROLE_UPDATED',
            message: 'User role updated successfully',
            data: {
                userId: req.params.id,
                newRole: role
            }
        });
    }
);

/**
 * Example Protected Routes - Customer
 */

/**
 * GET /customer/orders
 * Retrieve user's orders (authenticated customers only)
 */
router.get(
    '/orders',
    authMiddleware,
    (req, res) => {
        // Implementation would query orders for authenticated user
        res.status(200).json({
            status: 'success',
            code: 'ORDERS_RETRIEVED',
            message: 'Orders retrieved successfully',
            data: {
                userId: req.user.id,
                orders: [
                    // User's orders would go here
                ]
            }
        });
    }
);

/**
 * POST /customer/orders
 * Create order (authenticated customers only)
 */
router.post(
    '/orders',
    authMiddleware,
    (req, res) => {
        // Implementation would create order for authenticated user
        res.status(201).json({
            status: 'success',
            code: 'ORDER_CREATED',
            message: 'Order created successfully',
            data: {
                orderId: 'order_123',
                userId: req.user.id
                // Order details would go here
            }
        });
    }
);

    return router;
};
