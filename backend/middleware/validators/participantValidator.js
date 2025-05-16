// Handles request validation for participant management endpoints
const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const addParticipantsRules = () => [
    param('conversationId')
        .notEmpty().withMessage('Conversation ID is required.')
        .isString().withMessage('Conversation ID must be a string (or valid ID format).'), // Or .isUUID()
    body('userIdsToAdd')
        .isArray({ min: 1 }).withMessage('userIdsToAdd must be an array with at least one user ID.')
        .custom((value) => {
            if (!value.every(id => typeof id === 'string')) { // Or check for UUID format
                throw new Error('All user IDs in userIdsToAdd must be strings (or valid ID format).');
            }
            return true;
        })
];

const removeParticipantRules = () => [
    param('conversationId')
        .notEmpty().withMessage('Conversation ID is required.')
        .isString().withMessage('Conversation ID must be a string (or valid ID format).'), // Or .isUUID()
    param('userId')
        .notEmpty().withMessage('User ID to remove is required.')
        .isString().withMessage('User ID to remove must be a string (or valid ID format).') // Or .isUUID()
];

module.exports = {
    validateRequest,
    addParticipantsRules,
    removeParticipantRules,
};
