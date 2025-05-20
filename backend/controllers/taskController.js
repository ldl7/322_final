const TaskService = require('../services/taskService');
const httpStatus = require('http-status');
const logger = require('../utils/logger');

class TaskController {
  static async createTask(req, res) {
    try {
      const task = await TaskService.createTask(req.user.id, req.body);
      res.status(httpStatus.CREATED).json(task);
    } catch (error) {
      logger.error('Create task error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Error creating task',
      });
    }
  }

  static async getTasks(req, res) {
    try {
      const { status, limit = 10, offset = 0 } = req.query;
      const result = await TaskService.getTasks(req.user.id, { status, limit, offset });
      res.json(result);
    } catch (error) {
      logger.error('Get tasks error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching tasks',
      });
    }
  }

  static async getTask(req, res) {
    try {
      const task = await TaskService.getTaskById(req.user.id, req.params.taskId);
      res.json(task);
    } catch (error) {
      if (error.message === 'Task not found') {
        return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
      }
      logger.error('Get task error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching task',
      });
    }
  }

  static async updateTask(req, res) {
    try {
      const task = await TaskService.updateTask(
        req.user.id,
        req.params.taskId,
        req.body
      );
      res.json(task);
    } catch (error) {
      if (error.message === 'Task not found or not authorized') {
        return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
      }
      logger.error('Update task error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error updating task',
      });
    }
  }

  static async deleteTask(req, res) {
    try {
      await TaskService.deleteTask(req.user.id, req.params.taskId);
      res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error.message === 'Task not found or not authorized') {
        return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
      }
      logger.error('Delete task error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error deleting task',
      });
    }
  }

  static async getUpcomingTasks(req, res) {
    try {
      const tasks = await TaskService.getUpcomingTasks(
        req.user.id,
        req.query.days || 7
      );
      res.json(tasks);
    } catch (error) {
      logger.error('Get upcoming tasks error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching upcoming tasks',
      });
    }
  }
}

module.exports = TaskController;
