// Contains business logic and data access for participant management
const { Op } = require('sequelize');
const { Conversation, User, UserConversation, sequelize } = require('../models'); // Adjust path if your models are elsewhere
const logger = require('../utils/logger'); // Adjust path for your logger

/**
 * Adds participants to a group conversation.
 * @param {string} requesterId - The ID of the user making the request.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string[]} userIdsToAdd - An array of user IDs to add to the conversation.
 * @returns {Promise<Conversation>} The updated conversation object with all participants.
 * @throws {Error} If validation or permission checks fail.
 */
const addParticipants = async (requesterId, conversationId, userIdsToAdd) => {
    logger.info(`Adding participants to conversation ${conversationId}: requesterId=${requesterId}, usersToAdd=${userIdsToAdd.join(',')}`);

    if (!requesterId || !conversationId || !userIdsToAdd || userIdsToAdd.length === 0) {
        throw new Error('Requester ID, Conversation ID, and at least one User ID to add are required.');
    }

    const transaction = await sequelize.transaction();
    try {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                { model: User, as: 'participants', attributes: ['id'] },
                { model: User, as: 'creator', attributes: ['id'] }
            ],
            transaction
        });

        if (!conversation) {
            throw new Error(`Conversation with ID ${conversationId} not found.`);
        }

        if (conversation.type !== 'group') {
            throw new Error('Participants can only be added to group conversations.');
        }

        if (conversation.creatorId !== requesterId) {
            const authError = new Error('Only the conversation creator can add participants.');
            authError.status = 403; // Forbidden
            throw authError;
        }

        const existingParticipantIds = new Set(conversation.participants.map(p => p.id));
        const newParticipantIds = userIdsToAdd.filter(id => !existingParticipantIds.has(id) && id !== requesterId); // Ensure creator isn't re-added if somehow in list

        if (newParticipantIds.length === 0) {
            logger.info('No new participants to add (all users already in conversation or invalid).');
            // Fetch and return the current state of the conversation with full participant details
            await transaction.commit(); // Commit as no changes were made to UserConversation, but we did read.
            return Conversation.findByPk(conversationId, {
                include: [
                    { model: User, as: 'participants', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                    { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
                ]
            });
        }

        // Verify that all userIdsToAdd correspond to actual users
        const usersToAddExist = await User.count({ where: { id: { [Op.in]: newParticipantIds } } });
        if (usersToAddExist !== newParticipantIds.length) {
            throw new Error('One or more users to add do not exist.');
        }

        const userConversationEntries = newParticipantIds.map(userId => ({
            userId,
            conversationId: conversation.id,
        }));

        await UserConversation.bulkCreate(userConversationEntries, { transaction });
        
        // Update conversation's updatedAt timestamp
        await conversation.update({ updatedAt: new Date() }, { transaction });

        await transaction.commit();

        logger.info(`Successfully added ${newParticipantIds.length} participants to conversation ${conversationId}.`);
        // Fetch the conversation again with full participant details
        return Conversation.findByPk(conversationId, {
            include: [
                { model: User, as: 'participants', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
            ]
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Error adding participants:', error);
        if (!error.status) error.status = 500;
        throw error;
    }
};

/**
 * Removes a participant from a group conversation.
 * @param {string} requesterId - The ID of the user making the request.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userIdToRemove - The ID of the user to remove.
 * @returns {Promise<object>} A success message or the updated conversation.
 * @throws {Error} If validation or permission checks fail.
 */
const removeParticipant = async (requesterId, conversationId, userIdToRemove) => {
    logger.info(`Removing participant ${userIdToRemove} from conversation ${conversationId}: requesterId=${requesterId}`);

    if (!requesterId || !conversationId || !userIdToRemove) {
        throw new Error('Requester ID, Conversation ID, and User ID to remove are required.');
    }

    const transaction = await sequelize.transaction();
    try {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                { model: User, as: 'participants', attributes: ['id'] },
                { model: User, as: 'creator', attributes: ['id'] }
            ],
            transaction
        });

        if (!conversation) {
            throw new Error(`Conversation with ID ${conversationId} not found.`);
        }

        if (conversation.type !== 'group') {
            throw new Error('Participants can only be removed from group conversations.');
        }

        const isParticipantToRemoveInConversation = conversation.participants.some(p => p.id === userIdToRemove);
        if (!isParticipantToRemoveInConversation) {
            throw new Error(`User ${userIdToRemove} is not a participant in conversation ${conversationId}.`);
        }

        // Permission checks
        const isRequesterCreator = conversation.creatorId === requesterId;
        const isRequesterRemovingThemselves = requesterId === userIdToRemove;

        if (!isRequesterCreator && !isRequesterRemovingThemselves) {
            const authError = new Error('Only the conversation creator can remove other participants, or a user can remove themselves.');
            authError.status = 403; // Forbidden
            throw authError;
        }
        
        // Prevent creator from being removed by someone else (this case should be caught above, but as a safeguard)
        if (userIdToRemove === conversation.creatorId && !isRequesterRemovingThemselves) {
             const authError = new Error('The conversation creator cannot be removed by another user.');
             authError.status = 403;
             throw authError;
        }

        // Prevent removing the last participant
        if (conversation.participants.length <= 1 && isParticipantToRemoveInConversation) {
            // If the one to remove is indeed one of the (or the only) participant
            throw new Error('Cannot remove the last participant from a group conversation. Consider deleting the conversation instead.');
        }

        const result = await UserConversation.destroy({
            where: {
                userId: userIdToRemove,
                conversationId: conversation.id,
            },
            transaction
        });

        if (result === 0) {
            // Should have been caught by `isParticipantToRemoveInConversation` check, but good to have.
            throw new Error(`Failed to remove participant ${userIdToRemove}. User may not have been a participant or an issue occurred.`);
        }

        // Update conversation's updatedAt timestamp
        await conversation.update({ updatedAt: new Date() }, { transaction });

        await transaction.commit();

        logger.info(`Successfully removed participant ${userIdToRemove} from conversation ${conversationId}.`);
        
        // If the user removed themselves, and they were the creator, specific logic might be needed (e.g., assign new creator or archive chat)
        // For now, we'll just return a success message or the updated conversation without the removed participant.
        // Fetching the updated conversation is good practice.
        const updatedConversation = await Conversation.findByPk(conversationId, {
             include: [
                { model: User, as: 'participants', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
            ]
        });

        return {
            message: `Participant ${userIdToRemove} removed successfully.`,
            conversation: updatedConversation
        };

    } catch (error) {
        await transaction.rollback();
        logger.error('Error removing participant:', error);
        if (!error.status) error.status = 500;
        throw error;
    }
};

module.exports = {
    addParticipants,
    removeParticipant,
};

