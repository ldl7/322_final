/**
 * Message Model
 * 
 * Defines the Message model and its relationships.
 * Represents a single message in a conversation.
 * 
 * @module models/Message
 * @requires sequelize
 * @requires ../models/User
 * @requires ../models/Conversation
 * @requires ../utils/logger
 * 
 * @example
 * // Example usage:
 * const Message = require('../models/Message');
 * const message = await Message.create({ content, senderId, conversationId });
 * const messages = await Message.findByConversation(conversationId);
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
      Message.belongsTo(models.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
      Message.belongsTo(models.Message, { foreignKey: 'parentMessageId', as: 'parentMessage' });
      Message.hasMany(models.Message, { foreignKey: 'parentMessageId', as: 'replies' });
    }
  }

  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message content cannot be empty.' },
      },
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video'), 
      defaultValue: 'text',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sending', 'sent', 'delivered', 'read', 'failed'), 
      defaultValue: 'sending',
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'conversations', 
        key: 'id'
      }
    },
    parentMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_message_id',
      references: {
        model: 'messages', 
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON, // Changed from DataTypes.JSONB to DataTypes.JSON for MySQL compatibility
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    indexes: [
      {
        fields: ['conversation_id'],
      },
      {
        fields: ['sender_id'],
      },
      {
        fields: ['created_at'],
      }
    ]
  });

  return Message;
};
