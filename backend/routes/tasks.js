const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');

// Apply authentication middleware to all task routes
router.use(authenticate);

// Create a new task
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('category').optional().trim(),
    validate,
  ],
  TaskController.createTask
);

// Get all tasks with optional filtering
router.get(
  '/',
  [
    query('status').optional().isIn(['all', 'completed', 'pending']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validate,
  ],
  TaskController.getTasks
);

// Get a single task by ID
router.get(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validate,
  ],
  TaskController.getTask
);

// Update a task
router.put(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    body('category').optional().trim(),
    validate,
  ],
  TaskController.updateTask
);

// Delete a task
router.delete(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validate,
  ],
  TaskController.deleteTask
);

// Get upcoming tasks
router.get(
  '/upcoming/tasks',
  [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30').toInt(),
    validate,
  ],
  TaskController.getUpcomingTasks
);

module.exports = router;
