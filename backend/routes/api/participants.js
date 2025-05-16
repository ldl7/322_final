const express = require('express');
// Ensure mergeParams is true to access :conversationId from parent router
const router = express.Router({ mergeParams: true }); 
const participantController = require('../../controllers/participantController');
const {
    addParticipantsRules,
    removeParticipantRules,
    validateRequest
} = require('../../middleware/validators/participantValidator');
const authMiddleware = require('../../middleware/authMiddleware'); // Assuming this path

// @route   POST /
// @desc    Add participants to a conversation
// @access  Private
// (Mounted at /api/conversations/:conversationId/participants)
router.post(
    '/',
    authMiddleware,
    addParticipantsRules(),
    validateRequest,
    participantController.addParticipantsHandler
);

// @route   DELETE /:userId
// @desc    Remove a participant from a conversation
// @access  Private
// (Mounted at /api/conversations/:conversationId/participants/:userId)
router.delete(
    '/:userId',
    authMiddleware,
    removeParticipantRules(),
    validateRequest,
    participantController.removeParticipantHandler
);

module.exports = router;

