const express = require('express');
const { body, validationResult } = require('express-validator');
const ContactController = require('../controllers/ContactController');

module.exports = (Contact) => {
    const router = express.Router();
    const controller = new ContactController(Contact);

    const validate = [
        body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
        body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('subject').optional().trim().isLength({ max: 200 }),
        body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 2000 }),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ status: 'error', errors: errors.array() });
            }
            next();
        },
    ];

    router.post('/', validate, (req, res, next) => controller.create(req, res, next));

    return router;
};
