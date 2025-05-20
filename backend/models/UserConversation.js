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
      // Define associations to User and Conversation
      UserConversation.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      UserConversation.belongsTo(models.Conversation, { 
        foreignKey: 'conversationId',
        as: 'conversation'
      });
    }
  }

  UserConversation.init({
    // No 'id' field - using composite primary key instead
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true, // Part of composite primary key
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      field: 'user_id' // Explicitly map to DB column
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true, // Part of composite primary key
      references: {
        model: 'conversations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      field: 'conversation_id' // Explicitly map to DB column
    },
    // Timestamps with underscored fields
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    tableName: 'userconversations', // Lowercase to match actual database table name
    timestamps: true,
    underscored: true, // Enable snake_case conversion for column names
    // No need for indexes as we're using a composite primary key
  });

  // Add indexes for better query performance
  UserConversation.addHook('afterSync', 'addIndexes', async () => {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add composite unique index to prevent duplicate user-conversation pairs
    const indexes = await queryInterface.showIndex('userconversations');
    const hasCompositeIndex = indexes.some(index => 
      index.name === 'user_conversation_unique' || 
      (index.fields && index.fields.length === 2 && 
       index.fields.some(f => f.attribute === 'user_id') && 
       index.fields.some(f => f.attribute === 'conversation_id'))
    );
    
    if (!hasCompositeIndex) {
      await queryInterface.addIndex('userconversations', ['user_id', 'conversation_id'], {
        unique: true,
        name: 'user_conversation_unique'
      });
    }
  });

  return UserConversation;
};
