const { body, validationResult } = require('express-validator');

const validateUserRoleUpdate = [
    body('role').isIn(['customer', 'admin']).withMessage('role must be customer or admin')
];

const validateUserStatusUpdate = [
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
];

const validateOrderStatusUpdate = [
    body('status').isIn(['pending', 'paid', 'shipped', 'canceled']).withMessage('invalid order status')
];

const handleAdminValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            data: { errors: errors.array().reduce((acc, error) => ({ ...acc, [error.path]: error.msg }), {}) }
        });
    }
    next();
};

module.exports = {
    validateUserRoleUpdate,
    validateUserStatusUpdate,
    validateOrderStatusUpdate,
    handleAdminValidationErrors
};
