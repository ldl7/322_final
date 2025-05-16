// Request validation for conversation endpoints

// Handles request validation for conversation endpoints
const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const createConversationRules = () => [
    body('type')
        .optional()
        .isIn(['direct', 'group'])
        .withMessage("Type must be 'direct' or 'group'."),
    body('name')
        .if(body('type').equals('group'))
        .notEmpty()
        .withMessage('Name is required for group conversations.')
        .isString()
        .withMessage('Name must be a string.')
        .optional({ checkFalsy: true }), // Allow it to be absent if type is not 'group'
    body('participantUserIds')
        .isArray({ min: 1 })
        .withMessage('participantUserIds must be an array with at least one user ID.')
        .custom((value, { req }) => {
            if (req.body.type === 'direct' || (!req.body.type && value.length > 0)) { // Default to direct if type not specified
                if (value.length !== 1) {
                    throw new Error('For direct conversations, participantUserIds must contain exactly one user ID.');
                }
            }
            // For group chats, participantUserIds can have multiple IDs (min 1 checked by isArray)
            return true;
        }),
    body('participantUserIds.*') // Validate each element in the array
        .isString() // Or isUUID() if your IDs are UUIDs
        .withMessage('Each participant user ID must be a string (or a valid ID format).')
];

const getConversationByIdRules = () => [
    param('id')
        .notEmpty()
        .withMessage('Conversation ID cannot be empty.')
        .isString() // or .isUUID() if applicable
        .withMessage('Conversation ID must be a valid string (or UUID).')
];

module.exports = {
    validateRequest,
    createConversationRules,
    getConversationByIdRules,
};
