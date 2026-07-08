const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthService {
    constructor(User) {
        this.User = User;
    }

    /**
     * Register a new user
     */
    async register(userData) {
        const { firstName, lastName, email, password } = userData;

        // Check if user already exists
        const existingUser = await this.User.findOne({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            throw {
                code: 'USER_ALREADY_EXISTS',
                message: 'Email is already registered',
                status: 400
            };
        }

        // Create new user
        const user = await this.User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            role: 'customer'
        });

        // Generate JWT token
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            token,
            refreshToken
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Validate input
        if (!email || !password) {
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Email and password are required',
                status: 400
            };
        }

        // Find user by email
        const user = await this.User.findOne({ where: { email: email.toLowerCase() } });

        if (!user) {
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                status: 401
            };
        }

        // Check if account is locked
        if (user.isLocked()) {
            throw {
                code: 'ACCOUNT_LOCKED',
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
                status: 429
            };
        }

        // Check if account is active
        if (!user.isActive) {
            throw {
                code: 'ACCOUNT_INACTIVE',
                message: 'Your account has been deactivated',
                status: 403
            };
        }

        // Compare passwords
        const isPasswordValid = await user.matchPassword(password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            await user.incLoginAttempts();
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                status: 401
            };
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate tokens
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            token,
            refreshToken
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw {
                code: 'REFRESH_TOKEN_MISSING',
                message: 'Refresh token is required',
                status: 400
            };
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
            const user = await this.User.findByPk(decoded.id);

            if (!user || !user.isActive) {
                throw {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Invalid refresh token',
                    status: 401
                };
            }

            // Generate new access token
            const newToken = this.generateToken(user);

            return {
                token: newToken,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            throw {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token',
                status: 401
            };
        }
    }

    /**
     * Request password reset (generate reset token)
     */
    async requestPasswordReset(email) {
        const user = await this.User.findOne({ where: { email: email.toLowerCase() } });

        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            return {
                message: 'If email exists in our system, password reset link has been sent'
            };
        }

        // Generate password reset token
        const resetToken = user.getPasswordResetToken();
        await user.save();

        // In production, this would send an email with the reset link
        // For now, return the token for development/testing purposes
        return {
            message: 'Password reset email sent',
            resetToken: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? resetToken : undefined
        };
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        const { Op } = require('sequelize');

        // Hash the token to compare with stored token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await this.User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: new Date() },
                passwordResetUsed: false
            }
        });

        if (!user) {
            throw {
                code: 'INVALID_RESET_TOKEN',
                message: 'Password reset token is invalid or has expired',
                status: 400
            };
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordResetUsed = true;

        await user.save();

        return {
            message: 'Password has been reset successfully'
        };
    }

    /**
     * Generate JWT access token
     */
    generateToken(user) {
        const expiration = process.env.JWT_EXPIRATION || '24h';
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: expiration }
        );
    }

    /**
     * Generate JWT refresh token
     */
    generateRefreshToken(user) {
        const expiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
            { expiresIn: expiration }
        );
    }

    /**
     * Verify and decode token (without verification - use for admin operations)
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            throw {
                code: 'INVALID_TOKEN',
                message: 'Invalid token',
                status: 400
            };
        }
    }
}

module.exports = AuthService;
