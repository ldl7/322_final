/**
 * Routes for managing conversation participants
 */
const express = require('express');
const router = express.Router({ mergeParams: true });
const participantController = require('../controllers/participantController');
const { authenticate } = require('../middleware/authMiddleware');

// Add participant to conversation
router.post('/', authenticate, participantController.addParticipantsHandler);

// Remove participant from conversation
router.delete('/:userId', authenticate, participantController.removeParticipantHandler);

module.exports = router;
