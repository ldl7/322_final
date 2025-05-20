/**
 * Conversation Model
 * 
 * Defines the Conversation model and its relationships.
 * Represents a chat conversation between users.
 * 
 * @module models/Conversation
 * @requires sequelize
 * @requires ../models/User
 * @requires ../models/Message
 * @requires ../utils/logger
 * 
 * @example
 * // Example usage:
 * const Conversation = require('../models/Conversation');
 * const conversation = await Conversation.create({ type: 'direct' });
 * const conversations = await Conversation.findAllForUser(userId);
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Messages in this conversation
      Conversation.hasMany(models.Message, { 
        foreignKey: 'conversationId', 
        as: 'messages' 
      });
      
      // Participants in this conversation
      Conversation.belongsToMany(models.User, { 
        through: models.UserConversation, 
        foreignKey: 'conversationId', 
        otherKey: 'userId', 
        as: 'participants'
      });
      
      // User who created this conversation
      Conversation.belongsTo(models.User, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
      });
      
      // UserConversation entries for this conversation
      Conversation.hasMany(models.UserConversation, {
        foreignKey: 'conversationId',
        as: 'userConversations' // Changed to match the alias used in conversationService.js
      });
    }
  }

  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      // This field is called 'name' in the database, not 'title'
    },
    // Critical field: The database column is called 'createdBy' (camelCase)
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'createdBy', // Explicitly map to the camelCase column name
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Standard timestamps with proper mappings
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true,
    underscored: false, // Do NOT use snake_case for regular fields like createdBy
    createdAt: 'created_at', // But manually map timestamp fields
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (conversation) => {
        conversation.created_at = new Date();
        conversation.updated_at = new Date();
      },
      beforeUpdate: (conversation) => {
        conversation.updated_at = new Date();
      }
    }
  });

  // Add instance method to set participants
  Conversation.prototype.setParticipants = async function(userIds, options = {}) {
    const { transaction } = options;
    const UserConversation = this.sequelize.models.UserConversation;
    
    // Remove all existing participants
    await UserConversation.destroy({
      where: { conversationId: this.id },
      transaction
    });
    
    // Add new participants
    if (userIds && userIds.length > 0) {
      const participantRecords = userIds.map(userId => ({
        userId,
        conversationId: this.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await UserConversation.bulkCreate(participantRecords, { transaction });
    }
    
    // Reload the conversation with participants
    return this.reload({
      include: [
        {
          model: this.sequelize.models.User,
          as: 'participants',
          through: { attributes: [] } // Exclude join table attributes
        }
      ],
      transaction
    });
  };

  return Conversation;
};
