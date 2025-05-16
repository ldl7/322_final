'use strict';

/**
 * Models Index
 * 
 * This file initializes all Sequelize models and their relationships.
 * It automatically imports all model files from this directory and sets up associations.
 * 
 * @module models/index
 * @requires fs
 * @requires path
 * @requires sequelize
 * @requires process
 * @requires ../config/config
 * 
 * @example
 * // Example usage:
 * const { User, Conversation, Message } = require('./models');
 * // Now you can use the models with their associations set up
 */

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

// Initialize an empty database object to hold all models
const db = {};

// Create Sequelize instance with configuration
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Import all model files from this directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && // Skip hidden files
      file !== basename && // Skip this file
      file.slice(-3) === '.js' && // Only .js files
      file.indexOf('.test.js') === -1 // Skip test files
    );
  })
  .forEach(file => {
    // Import each model file
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Add model to the db object
  });

// Set up model associations if they exist
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add Sequelize instance and class to the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
