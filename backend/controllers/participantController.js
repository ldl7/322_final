// Handles HTTP requests for participant management and delegates to participantService
const participantService = require('../services/participantService');
const logger = require('../utils/logger');

/**
 * @description Add participants to a group conversation.
 * @route POST /api/conversations/:conversationId/participants
 * @access Private (Typically, only creator or authorized users)
 */
const addParticipantsHandler = async (req, res) => {
    const requesterId = req.user.id;
    const { conversationId } = req.params;
    const { userIdsToAdd } = req.body;

    if (!userIdsToAdd || !Array.isArray(userIdsToAdd) || userIdsToAdd.length === 0) {
        return res.status(400).json({ message: 'userIdsToAdd must be a non-empty array.' });
    }

    try {
        const updatedConversation = await participantService.addParticipants(requesterId, conversationId, userIdsToAdd);
        // TODO: Emit WebSocket event to notify existing participants and newly added ones.
        // Example: req.io.to(conversationId).emit('participantsAdded', { conversationId, addedUserIds: userIdsToAdd, updatedConversation });
        // Notify each newly added user individually as well so their client can join the room/update UI
        // userIdsToAdd.forEach(uid => req.io.to(uid).emit('addedToConversation', updatedConversation));
        res.status(200).json(updatedConversation);
    } catch (error) {
        logger.error(`Error in addParticipantsHandler for conversation ${conversationId}:`, error);
        if (error.status === 403) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('not found') || error.message.includes('do not exist')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('only be added to group') || error.message.includes('already in conversation')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to add participants', error: error.message });
    }
};

/**
 * @description Remove a participant from a group conversation.
 * @route DELETE /api/conversations/:conversationId/participants/:userId
 * @access Private (Creator can remove others; user can remove themselves)
 */
const removeParticipantHandler = async (req, res) => {
    const requesterId = req.user.id;
    const { conversationId, userId: userIdToRemove } = req.params;

    if (!userIdToRemove) {
        return res.status(400).json({ message: 'User ID to remove is required in the path.' });
    }

    try {
        const result = await participantService.removeParticipant(requesterId, conversationId, userIdToRemove);
        // TODO: Emit WebSocket event to notify remaining participants and the removed user.
        // Example: req.io.to(conversationId).emit('participantRemoved', { conversationId, removedUserId: userIdToRemove, updatedConversation: result.conversation });
        // Notify the removed user so their client can leave the room/update UI
        // req.io.to(userIdToRemove).emit('removedFromConversation', { conversationId });
        res.status(200).json(result); // result contains { message, conversation }
    } catch (error) {
        logger.error(`Error in removeParticipantHandler for conversation ${conversationId}, user ${userIdToRemove}:`, error);
        if (error.status === 403) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('not found') || error.message.includes('not a participant')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('only be removed from group') || error.message.includes('Cannot remove the last participant')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to remove participant', error: error.message });
    }
};

module.exports = {
    addParticipantsHandler,
    removeParticipantHandler,
};

