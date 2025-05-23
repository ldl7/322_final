const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateJWT } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validators/commonValidator');

// Apply authentication middleware to all task routes
router.use(authenticateJWT);

// Create a new task
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('category').optional().trim(),
  ],
  validateRequest,
  TaskController.createTask
);

// Get all tasks with optional filtering
router.get(
  '/',
  [
    query('status').optional().isIn(['all', 'completed', 'pending']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validateRequest,
  TaskController.getTasks
);

// Get a single task by ID
router.get(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID')
  ],
  validateRequest,
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
    body('category').optional().trim()
  ],
  validateRequest,
  TaskController.updateTask
);

// Delete a task
router.delete(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID')
  ],
  validateRequest,
  TaskController.deleteTask
);

// Get upcoming tasks
router.get(
  '/upcoming/tasks',
  [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30').toInt()
  ],
  validateRequest,
  TaskController.getUpcomingTasks
);

module.exports = router;
