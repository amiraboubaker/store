const { body, query, validationResult } = require('express-validator');

const validateProductCreation = [
    body('name').trim().notEmpty().withMessage('name is required').isLength({ min: 2, max: 255 }),
    body('price').isFloat({ gt: 0 }).withMessage('price must be greater than 0'),
    body('category').trim().notEmpty().withMessage('category is required'),
    body('stock').isInt({ min: 0 }).withMessage('stock must be greater than or equal to 0'),
    body('description').trim().notEmpty().withMessage('description is required'),
    body('images').optional().isArray(),
    body('material').optional().trim()
];

const validateProductQuery = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('minPrice').optional().isFloat({ gt: 0 }),
    query('maxPrice').optional().isFloat({ gt: 0 })
];

const handleProductValidationErrors = (req, res, next) => {
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
    validateProductCreation,
    validateProductQuery,
    handleProductValidationErrors
};
