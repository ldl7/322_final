/**
 * Logger Utility
 *
 * Centralized logging service for the application.
 * Supports different log levels and transports (console, file, etc.).
 *
 * @module utils/logger
 * @requires winston
 * @requires winston-daily-rotate-file
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Define the log directory
const logDirectory = path.join(__dirname, '../logs');

// Custom log format
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info'
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    align(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: path.join(logDirectory, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Max size of each log file
      maxFiles: '14d', // Keep logs for 14 days
      format: combine(timestamp(), json()), // File logs in JSON format
      level: 'debug', // Log debug and above to file
    }),
    new DailyRotateFile({
      filename: path.join(logDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), json()),
      level: 'error', // Log only errors to this file
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), align(), logFormat),
    }),
    new DailyRotateFile({
      filename: path.join(logDirectory, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), json()),
    }),
  ],
  rejectionHandlers: [ // Handle unhandled promise rejections
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), align(), logFormat),
    }),
    new DailyRotateFile({
      filename: path.join(logDirectory, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), json()),
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports
    logger.info(message.trim());
  },
};

module.exports = logger;
