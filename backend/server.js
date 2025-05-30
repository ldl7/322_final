'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { sequelize } = require('./models'); // Corrected: import sequelize instance

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const aiChatRoutes = require('./routes/aiChat');
// Message routes are now imported and mounted within conversation routes

// WebSocket middleware and event handlers
const socketAuthMiddleware = require('./middleware/websocket/auth');
// Socket event handlers are currently disabled
// const initializeSocketEventHandlers = require('./socket/events');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : ['http://localhost:3000', 'http://localhost:19000', 'http://localhost:19006', 
         'exp://localhost:19000', 'exp://127.0.0.1:19000', 
         'exp://69.120.124.150:19000', 'http://69.120.124.150:19000',
         'http://69.120.124.150:5000', 'http://69.120.124.150:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8 // 100MB
});

// Make io instance available in app requests (if needed, though typically not for io itself)
app.set('io', io);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:3000', 'http://localhost:19000', 'http://localhost:19006', 
       'exp://localhost:19000', 'exp://127.0.0.1:19000', 
       'exp://69.120.124.150:19000', 'http://69.120.124.150:19000',
       'http://69.120.124.150:5000', 'http://69.120.124.150:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000).toString()), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per windowMs per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiChatRoutes);
// Removed top-level message routes - these should only be accessed via conversations

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  });
});

// Socket.IO Middleware and Connection Handling
io.use(socketAuthMiddleware); // Apply authentication middleware to Socket.IO
io.on('connection', (socket) => {
  if (socket.user) {
    logger.info(`Authenticated client connected: ${socket.user.username} (Socket ID: ${socket.id})`);
    socket.join(socket.user.id.toString()); // Join a room specific to the user
    // Socket event handlers are currently disabled
    // initializeSocketEventHandlers(io, socket);
    logger.info('Socket event handlers are currently not initialized.');
  } else {
    logger.warn(`Unauthenticated client connected (Socket ID: ${socket.id}). Disconnecting.`);
    socket.disconnect(true);
    return;
  }

  socket.on('disconnect', () => {
    if (socket.user) {
      logger.info(`Client disconnected: ${socket.user.username} (Socket ID: ${socket.id})`);
    }
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for user ${socket.user ? socket.user.username : 'unknown'}:`, error);
  });
});

// 404 Handler (after all routes)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// Global Error Handling Middleware (last middleware)
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.stack || err.message || err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Test user creation is currently disabled
// const createTestUser = require('./seeders/createTestUser');

// Database connection and server start
sequelize.authenticate()
  .then(async () => {
    logger.info('Database connection established successfully.');
    
    // Test user creation is currently disabled
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Test user creation is currently skipped as createTestUser.js is not found.');
      // try {
      //   logger.info('Setting up test user...');
      //   const result = await createTestUser();
      //   if (result.success) {
      //     logger.info(result.message);
      //   } else {
      //     logger.error('Failed to create test user:', result.message);
      //     if (result.error) logger.error('Error details:', result.error);
      //   }
      // } catch (error) {
      //   logger.error('Unexpected error in test user setup:', error);
      // }
    }
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Server bound to all network interfaces (0.0.0.0)`);
    });
  })
  .catch(error => {
    logger.error('Unable to connect to the database:', error);
    process.exit(1); // Exit if DB connection fails
  });

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing database connection:', err);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Handle Ctrl+C

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally, close server and exit
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Optionally, close server and exit
  process.exit(1); // Mandatory exit after uncaught exception
});

module.exports = { app, server, io };
