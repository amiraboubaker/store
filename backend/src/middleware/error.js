/**
 * Error handling middleware.
 *
 * Authentication middleware used to live here alongside it and was removed with
 * the users table. Only the error handler remains, since there is no User model
 * left for a token to resolve to.
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

    // Malformed JSON body. body-parser marks these, and they are the client's
    // fault, so answer 400 rather than falling through to the 500 branch.
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            code: 'INVALID_JSON',
            message: 'Request body is not valid JSON',
            data: null
        });
    }

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

    console.error('Error:', err);

    // Default error
    res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        data: null
    });
};

module.exports = { errorHandler };