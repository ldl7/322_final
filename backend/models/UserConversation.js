/**
 * UserConversation Model (Join Table)
 * 
 * Defines the join table between Users and Conversations.
 * Represents a user's participation in a conversation.
 * 
 * @module models/UserConversation
 * @requires sequelize
 */

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class UserConversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed, though primary associations are in User and Conversation
      // For example, if UserConversation had its own specific relations beyond the join:
      // UserConversation.belongsTo(models.User, { foreignKey: 'userId' });
      // UserConversation.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
    }
  }

  UserConversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    // You could add more attributes here, e.g.:
    // joinedAt: {
    //   type: DataTypes.DATE,
    //   defaultValue: DataTypes.NOW,
    //   allowNull: false,
    // },
    // lastReadMessageId: {
    //   type: DataTypes.UUID,
    //   allowNull: true,
    // },
    // muted: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    // }
  }, {
    sequelize,
    modelName: 'UserConversation',
    tableName: 'user_conversations', // Explicitly define table name
    timestamps: true, // Adds createdAt and updatedAt timestamps
    indexes: [
      {
        unique: true,
        fields: ['userId', 'conversationId'],
        name: 'user_conversation_unique_idx'
      }
    ]
  });

  return UserConversation;
};
