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
      // define association here
      Conversation.hasMany(models.Message, { foreignKey: 'conversationId', as: 'messages' });
      Conversation.belongsToMany(models.User, { through: models.UserConversation, foreignKey: 'conversationId', otherKey: 'userId', as: 'participants' });
      Conversation.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
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
      defaultValue: 'direct',
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true, // Optional, mainly for group chats
      validate: {
        len: {
          args: [0, 255],
          msg: 'Conversation name must be less than 255 characters.'
        }
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true, 
  });

  return Conversation;
};
