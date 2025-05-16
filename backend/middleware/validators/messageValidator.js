// Handles request validation for message endpoints
const { body, param, query, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const sendMessageRules = () => [
    param('conversationId')
        .notEmpty().withMessage('Conversation ID is required.')
        .isString().withMessage('Conversation ID must be a string (or valid ID format).'), // Or .isUUID()
    body('content')
        .notEmpty().withMessage('Message content cannot be empty.')
        .isString().withMessage('Content must be a string.'),
    body('type')
        .optional()
        .isString().withMessage('Message type must be a string.')
        .isIn(['text', 'image', 'file', 'audio', 'video', 'system'])
        .withMessage("Invalid message type. Allowed types: 'text', 'image', 'file', 'audio', 'video', 'system'."),
    body('metadata')
        .optional()
        .isObject().withMessage('Metadata must be an object.')
];

const getMessagesRules = () => [
    param('conversationId')
        .notEmpty().withMessage('Conversation ID is required.')
        .isString().withMessage('Conversation ID must be a string (or valid ID format).'), // Or .isUUID()
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100.')
        .toInt(),
    query('beforeMessageId')
        .optional()
        .isString().withMessage('beforeMessageId must be a string (or valid ID format).') // Or .isUUID()
        .custom((value, { req }) => {
            if (value && (req.query.page || req.query.afterMessageId)) {
                throw new Error('beforeMessageId cannot be used with page-based pagination or afterMessageId.');
            }
            return true;
        }),
    query('afterMessageId')
        .optional()
        .isString().withMessage('afterMessageId must be a string (or valid ID format).') // Or .isUUID()
        .custom((value, { req }) => {
            if (value && (req.query.page || req.query.beforeMessageId)) {
                throw new Error('afterMessageId cannot be used with page-based pagination or beforeMessageId.');
            }
            return true;
        })
];

const markMessagesAsReadRules = () => [
    param('conversationId')
        .notEmpty().withMessage('Conversation ID is required.')
        .isString().withMessage('Conversation ID must be a string (or valid ID format).'), // Or .isUUID()
    body('lastReadMessageId')
        .optional({ checkFalsy: true }) // Allows null or empty string to be considered 'absent'
        .isString().withMessage('lastReadMessageId must be a string (or valid ID format) if provided.') // Or .isUUID()
];

module.exports = {
    validateRequest,
    sendMessageRules,
    getMessagesRules,
    markMessagesAsReadRules,
};
