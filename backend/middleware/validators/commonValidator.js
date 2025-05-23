// backend/middleware/validators/commonValidator.js
const { validationResult } = require('express-validator');
const httpStatusCodes = require('http-status-codes');

/**
 * Middleware to handle the result of express-validator validations.
 * If errors exist, sends a 400 response. Otherwise, passes to the next middleware.
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRequest
};
