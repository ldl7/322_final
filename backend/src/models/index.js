const { sequelize, Sequelize } = require('../config/sequelize');
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
const User = require('./User');
const Message = require('./Message');
const Conversation = require('./Conversation');

// Initialize models
db.User = User(sequelize, Sequelize);
db.Message = Message(sequelize, Sequelize);
db.Conversation = Conversation(sequelize, Sequelize);

// Define relationships
const { User: UserModel, Message: MessageModel, Conversation: ConversationModel } = db;

// User has many Messages (as sender)
UserModel.hasMany(MessageModel, {
  foreignKey: 'senderId',
  as: 'sentMessages'
});

// Message belongs to User (sender)
MessageModel.belongsTo(UserModel, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Conversation has many Messages
ConversationModel.hasMany(MessageModel, {
  foreignKey: 'conversationId',
  as: 'messages'
});

// Message belongs to Conversation
MessageModel.belongsTo(ConversationModel, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

// User belongs to many Conversations (Participants)
UserModel.belongsToMany(ConversationModel, {
  through: 'UserConversations',
  as: 'conversations',
  foreignKey: 'userId'
});

// Conversation belongs to many Users (Participants)
ConversationModel.belongsToMany(UserModel, {
  through: 'UserConversations',
  as: 'participants',
  foreignKey: 'conversationId'
});

module.exports = db;
