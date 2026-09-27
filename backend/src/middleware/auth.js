const jwt = require('jsonwebtoken');

/**
 * Create auth middleware with User model
 */
const createAuthMiddleware = (User) => {
    /**
     * Middleware to authenticate JWT token
     * Verifies token validity and adds user to request object
     */
    const authMiddleware = async (req, res, next) => {
        try {
            // Extract token from Authorization header (Bearer token)
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    status: 'error',
                    code: 'AUTH_MISSING_TOKEN',
                    message: 'Access token is missing',
                    data: null
                });
            }

            const token = authHeader.substring(7);

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

            // Fetch user from database
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    code: 'AUTH_USER_NOT_FOUND',
                    message: 'User not found',
                    data: null
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    status: 'error',
                    code: 'AUTH_USER_INACTIVE',
                    message: 'User account is inactive',
                    data: null
                });
            }

            // Attach user to request object
            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    code: 'AUTH_TOKEN_EXPIRED',
                    message: 'Access token has expired',
                    data: null
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    status: 'error',
                    code: 'AUTH_INVALID_TOKEN',
                    message: 'Invalid access token',
                    data: null
                });
            }

            res.status(500).json({
                status: 'error',
                code: 'AUTH_VERIFICATION_FAILED',
                message: 'Token verification failed',
                data: null
            });
        }
    };

    /**
     * Middleware for optional authentication
     * Verifies token if present, but doesn't require it
     */
    const optionalAuthMiddleware = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            const user = await User.findByPk(decoded.id);

            if (user && user.isActive) {
                req.user = user;
                req.token = token;
            }
        } catch (error) {
            // Silently fail - token is optional
        }

        next();
    };

    return { authMiddleware, optionalAuthMiddleware };
};

/**
 * Middleware to authorize based on user roles
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                code: 'AUTH_NOT_AUTHENTICATED',
                message: 'Not authenticated',
                data: null
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions to access this resource',
                data: { requiredRoles: allowedRoles, userRole: req.user.role }
            });
        }

        next();
    };
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Rejected by the CORS allowlist (thrown by the cors middleware)
    if (err.message && err.message.startsWith('CORS blocked:')) {
        return res.status(403).json({
            status: 'error',
            code: 'CORS_ORIGIN_NOT_ALLOWED',
            message: 'Origin is not allowed',
            data: null
        });
    }

    // Payload too large
    if (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError') {
        return res.status(413).json({
            status: 'error',
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Request payload exceeds size limit',
            data: null
        });
    }

    console.error('Error:', err);

    // Validation errors
    if (err.validationErrors) {
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            data: { errors: err.validationErrors }
        });
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.fields ? Object.keys(err.fields)[0] : 'field';
        return res.status(400).json({
            status: 'error',
            code: 'DUPLICATE_ENTRY',
            message: `${field} already exists`,
            data: null
        });
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const errors = {};
        err.errors.forEach(e => {
            errors[e.path] = e.message;
        });
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            data: { errors }
        });
    }

    // Default error
    res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        data: null
    });
};

module.exports = {
    createAuthMiddleware,
    roleMiddleware,
    errorHandler
};
