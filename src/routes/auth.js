const express = require('express');
const AuthController = require('../controllers/AuthController');
const {
    validateRegistration,
    validateLogin,
    validatePasswordResetRequest,
    validatePasswordReset,
    handleValidationErrors
} = require('../middleware/validation');
const { createAuthMiddleware } = require('../middleware/auth');

/**
 * Create auth routes with User model
 */
module.exports = (User) => {
    const router = express.Router();
    const { authMiddleware } = createAuthMiddleware(User);
    const authController = new AuthController(User);

    /**
     * Public Routes
     */

    /**
     * POST /auth/register
     * Register a new user
     * 
     * Body:
     * {
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "email": "john@example.com",
     *   "password": "SecurePass123!",
     *   "confirmPassword": "SecurePass123!"
     * }
     */
    router.post(
        '/register',
        validateRegistration,
        handleValidationErrors,
        (req, res, next) => authController.register(req, res, next)
    );

    /**
     * POST /auth/login
     * Login user
     * 
     * Body:
     * {
     *   "email": "john@example.com",
     *   "password": "SecurePass123!"
     * }
     */
    router.post(
        '/login',
        validateLogin,
        handleValidationErrors,
        (req, res, next) => authController.login(req, res, next)
    );

    /**
     * POST /auth/refresh
     * Refresh access token
     * 
     * Body:
     * {
     *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * }
     */
    router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

    /**
     * POST /auth/request-password-reset
     * Request password reset
     * 
     * Body:
     * {
     *   "email": "john@example.com"
     * }
     */
    router.post(
        '/request-password-reset',
        validatePasswordResetRequest,
        handleValidationErrors,
        (req, res, next) => authController.requestPasswordReset(req, res, next)
    );

    /**
     * POST /auth/reset-password
     * Reset password with token
     * 
     * Body:
     * {
     *   "token": "a1b2c3d4e5f6...",
     *   "newPassword": "NewSecurePass123!",
     *   "confirmPassword": "NewSecurePass123!"
     * }
     */
    router.post(
        '/reset-password',
        validatePasswordReset,
        handleValidationErrors,
        (req, res, next) => authController.resetPassword(req, res, next)
    );

    /**
     * Protected Routes
     */

    /**
     * POST /auth/logout
     * Logout user (requires authentication)
     */
    router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

    /**
     * GET /auth/me
     * Get current user profile (requires authentication)
     */
    router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req, res, next));

    /**
     * PUT /auth/profile
     * Update user profile (requires authentication)
     * 
     * Body:
     * {
     *   "firstName": "Jane",
     *   "lastName": "Doe"
     * }
     */
    router.put('/profile', authMiddleware, (req, res, next) => authController.updateProfile(req, res, next));

    /**
     * POST /auth/change-password
     * Change password (requires authentication)
     * 
     * Body:
     * {
     *   "oldPassword": "SecurePass123!",
     *   "newPassword": "NewSecurePass123!",
     *   "confirmPassword": "NewSecurePass123!"
     * }
     */
    router.post(
        '/change-password',
        authMiddleware,
        validatePasswordReset,
        handleValidationErrors,
        (req, res, next) => authController.changePassword(req, res, next)
    );

    return router;
};
