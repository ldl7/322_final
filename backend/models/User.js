'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Message, { foreignKey: 'sender_id', as: 'sentMessages' });
      User.belongsToMany(models.Conversation, { 
        through: 'UserConversations',
        foreignKey: 'user_id',
        otherKey: 'conversation_id',
        as: 'conversations' 
      });
    }

    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    async generateAuthTokens() {
      const jwt = require('jsonwebtoken');
      const config = require('../config/config');
      
      const accessToken = jwt.sign(
        { id: this.id, role: this.role },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpirationMinutes * 60 }
      );
      
      const refreshToken = jwt.sign(
        { id: this.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpirationDays * 24 * 60 * 60 }
      );
      
      this.refresh_token = refreshToken;
      await this.save();
      
      return { accessToken, refreshToken };
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'id'
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'username',
      validate: {
        notEmpty: { msg: 'Username cannot be empty.' },
        len: {
          args: [3, 30],
          msg: 'Username must be between 3 and 30 characters.'
        },
        is: {
          args: /^[a-zA-Z0-9_]+$/,
          msg: 'Username can only contain letters, numbers, and underscores.'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'email',
      validate: {
        isEmail: { msg: 'Invalid email address.' },
        notEmpty: { msg: 'Email cannot be empty.' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password',
      validate: {
        notEmpty: { msg: 'Password cannot be empty.' },
        len: {
          args: [8, 100],
          msg: 'Password must be at least 8 characters long.'
        }
      }
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name',
      validate: {
        len: {
          args: [1, 50],
          msg: 'First name must be between 1 and 50 characters.'
        }
      }
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name',
      validate: {
        len: {
          args: [1, 50],
          msg: 'Last name must be between 1 and 50 characters.'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
      field: 'role'
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_email_verified'
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'refresh_token'
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token'
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_verification_token'
    },
    email_verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_token_expires'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: {
      attributes: { 
        exclude: [
          'password', 
          'refresh_token', 
          'password_reset_token', 
          'email_verification_token',
          'email_verification_token_expires',
          'password_reset_expires'
        ] 
      },
    },
    scopes: {
      withSensitiveData: {
        attributes: { 
          include: [
            'password', 
            'refresh_token', 
            'password_reset_token', 
            'email_verification_token',
            'email_verification_token_expires',
            'password_reset_expires'
          ] 
        },
      },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};
