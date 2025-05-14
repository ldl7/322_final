/**
 * taskActions.ts
 *
 * This file contains Redux action creators for task management.
 * 
 * Features:
 * - Defines action types and async thunks for task operations
 * - Implements CRUD operations (Create, Read, Update, Delete)
 * - Includes error handling for failed operations
 * - Manages loading states during async operations
 *
 * These actions use Redux Toolkit's createAsyncThunk for consistent
 * handling of async operations and are used by the tasks slice to update state.
 */

import { Task, NewTask } from '../../types/task'; 
import { createAsyncThunk } from '@reduxjs/toolkit';

// Add a new task (simulating API call)
export const addTask = createAsyncThunk<Task, NewTask>(
  'tasks/addTask',
  async (newTaskData, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTask: Task = {
        ...newTaskData,
        id: Math.random().toString(36).substr(2, 9),
        completed: newTaskData.completed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTask;
    } catch (error) {
      return rejectWithValue('Failed to add task');
    }
  }
);

// Toggle task completion (simulating API call)
export const toggleTask = createAsyncThunk<Partial<Task>, { taskId: string; completed: boolean }>(
  'tasks/toggleTask',
  async ({ taskId, completed }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      // Return the updated task data, including completionDate
      return {
        id: taskId,
        completed,
        updatedAt: now,
        completionDate: completed ? now : undefined, // Set or clear completionDate
      } as Partial<Task>; // Return Partial<Task> as we're only updating some fields
    } catch (error) {
      return rejectWithValue('Failed to toggle task status');
    }
  }
);

// Load initial tasks (simulating API call)
export const fetchTasks = createAsyncThunk<Task[]>(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - in a real app, this would come from an API
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete project setup',
          description: 'Set up the project structure and dependencies',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Design UI components',
          description: 'Create mockups for the main screens',
          dueDate: new Date(Date.now() + 172800000).toISOString(),
          priority: 'medium',
          completed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return mockTasks;
    } catch (error) {
      return rejectWithValue('Failed to load tasks');
    }
  }
);

// Delete a task (simulating API call)
export const deleteTask = createAsyncThunk<string, string>(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return taskId;
    } catch (error) {
      return rejectWithValue('Failed to delete task');
    }
  }
);
