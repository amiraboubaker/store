const { body, validationResult } = require('express-validator');

/**
 * Validate registration input
 */
const validateRegistration = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters')
        .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name contains invalid characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters')
        .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('Last name contains invalid characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .isLength({ max: 100 }).withMessage('Password must not exceed 100 characters')
        .matches(/^(?=.*[a-z])/).withMessage('Password must contain at least one lowercase letter')
        .matches(/^(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
        .matches(/^(?=.*\d)/).withMessage('Password must contain at least one digit')
        .matches(/^(?=.*[@$!%*?&])/).withMessage('Password must contain at least one special character (@$!%*?&)'),

    body('confirmPassword')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
];

/**
 * Validate login input
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Invalid email or password')
];

/**
 * Validate password reset request
 */
const validatePasswordResetRequest = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
];

/**
 * Validate password reset (with token)
 */
const validatePasswordReset = [
    body('token')
        .notEmpty().withMessage('Reset token is required')
        .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .isLength({ max: 100 }).withMessage('Password must not exceed 100 characters')
        .matches(/^(?=.*[a-z])/).withMessage('Password must contain at least one lowercase letter')
        .matches(/^(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
        .matches(/^(?=.*\d)/).withMessage('Password must contain at least one digit')
        .matches(/^(?=.*[@$!%*?&])/).withMessage('Password must contain at least one special character (@$!%*?&)'),

    body('confirmPassword')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match')
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc, error) => {
            acc[error.path || error.param] = error.msg;
            return acc;
        }, {});

        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            data: { errors: formattedErrors }
        });
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validatePasswordResetRequest,
    validatePasswordReset,
    handleValidationErrors
};
