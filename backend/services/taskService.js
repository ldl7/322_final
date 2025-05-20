const { Task } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class TaskService {
  static async createTask(userId, taskData) {
    try {
      const task = await Task.create({
        ...taskData,
        userId,
      });
      return task;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  static async getTasks(userId, { status, limit = 10, offset = 0 }) {
    try {
      const where = { userId };
      
      if (status === 'completed') {
        where.completed = true;
      } else if (status === 'pending') {
        where.completed = false;
      }

      const { count, rows } = await Task.findAndCountAll({
        where,
        order: [['dueDate', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        tasks: rows,
        total: count,
        hasMore: offset + rows.length < count,
      };
    } catch (error) {
      logger.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  static async getTaskById(userId, taskId) {
    try {
      const task = await Task.findOne({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      logger.error('Error fetching task:', error);
      throw error;
    }
  }

  static async updateTask(userId, taskId, updateData) {
    try {
      const [updated] = await Task.update(updateData, {
        where: {
          id: taskId,
          userId,
        },
        returning: true,
      });

      if (!updated) {
        throw new Error('Task not found or not authorized');
      }

      return await Task.findByPk(taskId);
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(userId, taskId) {
    try {
      const deleted = await Task.destroy({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!deleted) {
        throw new Error('Task not found or not authorized');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  }

  static async getUpcomingTasks(userId, days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(days));

      return await Task.findAll({
        where: {
          userId,
          completed: false,
          dueDate: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [['dueDate', 'ASC']],
      });
    } catch (error) {
      logger.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to fetch upcoming tasks');
    }
  }
}

module.exports = TaskService;
