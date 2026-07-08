const AuthService = require('../services/AuthService');

class AuthController {
    constructor(User) {
        this.User = User;
        this.authService = new AuthService(User);
    }

    /**
     * POST /auth/register
     * Register a new user
     */
    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password } = req.body;

            const result = await this.authService.register({
                firstName,
                lastName,
                email,
                password
            });

            res.status(201).json({
                status: 'success',
                code: 'USER_REGISTERED',
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    token: result.token,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            if (error.code === 'USER_ALREADY_EXISTS') {
                return res.status(400).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            next(error);
        }
    }

    /**
     * POST /auth/login
     * Login user
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await this.authService.login(email, password);

            res.status(200).json({
                status: 'success',
                code: 'LOGIN_SUCCESS',
                message: 'Login successful',
                data: {
                    user: result.user,
                    token: result.token,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            if (error.status === 401) {
                return res.status(401).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            if (error.status === 429) {
                return res.status(429).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            if (error.status === 403) {
                return res.status(403).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            next(error);
        }
    }

    /**
     * POST /auth/logout
     * Logout user (token invalidation on frontend, server-side token blacklist optional)
     */
    async logout(req, res) {
        // In a production system, you might want to:
        // 1. Add token to a blacklist (Redis)
        // 2. Invalidate refresh tokens in database
        // For now, logout is handled client-side by deleting tokens

        res.status(200).json({
            status: 'success',
            code: 'LOGOUT_SUCCESS',
            message: 'Logged out successfully',
            data: null
        });
    }

    /**
     * POST /auth/refresh
     * Refresh access token
     */
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;

            const result = await this.authService.refreshToken(refreshToken);

            res.status(200).json({
                status: 'success',
                code: 'TOKEN_REFRESHED',
                message: 'Token refreshed successfully',
                data: {
                    token: result.token,
                    user: result.user
                }
            });
        } catch (error) {
            if (error.status === 401) {
                return res.status(401).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            next(error);
        }
    }

    /**
     * POST /auth/request-password-reset
     * Request password reset email
     */
    async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;

            const result = await this.authService.requestPasswordReset(email);

            // Always return 200 to avoid email enumeration attacks
            res.status(200).json({
                status: 'success',
                code: 'PASSWORD_RESET_REQUESTED',
                message: result.message,
                data: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? result : null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /auth/reset-password
     * Reset password with token
     */
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;

            const result = await this.authService.resetPassword(token, newPassword);

            res.status(200).json({
                status: 'success',
                code: 'PASSWORD_RESET_SUCCESS',
                message: result.message,
                data: null
            });
        } catch (error) {
            if (error.status === 400) {
                return res.status(400).json({
                    status: 'error',
                    code: error.code,
                    message: error.message,
                    data: null
                });
            }
            next(error);
        }
    }

    /**
     * GET /auth/me
     * Get current user profile
     */
    async getCurrentUser(req, res) {
        res.status(200).json({
            status: 'success',
            code: 'USER_PROFILE_RETRIEVED',
            message: 'User profile retrieved',
            data: {
                user: {
                    id: req.user.id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email,
                    role: req.user.role,
                    isEmailVerified: req.user.isEmailVerified,
                    isActive: req.user.isActive,
                    lastLoginAt: req.user.lastLoginAt,
                    createdAt: req.user.createdAt
                }
            }
        });
    }

    /**
     * PUT /auth/profile
     * Update user profile
     */
    async updateProfile(req, res, next) {
        try {
            const { firstName, lastName } = req.body;
            const userId = req.user.id;

            const updates = {};
            if (firstName) updates.firstName = firstName;
            if (lastName) updates.lastName = lastName;

            const user = await this.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }

            await user.update(updates);

            res.status(200).json({
                status: 'success',
                code: 'PROFILE_UPDATED',
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /auth/change-password
     * Change password (requires old password)
     */
    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Get user
            const user = await this.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }

            // Verify old password
            const isPasswordValid = await user.matchPassword(oldPassword);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    code: 'INVALID_OLD_PASSWORD',
                    message: 'Current password is incorrect',
                    data: null
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.status(200).json({
                status: 'success',
                code: 'PASSWORD_CHANGED',
                message: 'Password changed successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
