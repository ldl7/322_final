/**
 * task.ts
 *
 * This file defines TypeScript interfaces and types for tasks in the Coach Ally app.
 * It includes:
 * - Task interface: Main data structure for individual tasks
 * - TaskPriority type: Enumeration of possible priority levels
 * - TaskState interface: Structure for the tasks slice of the Redux store
 *
 * These types ensure consistency in data handling throughout the application
 * and provide type safety for task-related operations.
 */

export interface Task {
  id: string; // Unique identifier for the task
  title: string; // Main title or name of the task
  description?: string; // Optional detailed description of the task
  completed: boolean; // Status of whether the task is completed
  dueDate?: string | null; // Optional due date for the task (ISO string format)
  priority: 'low' | 'medium' | 'high'; // Priority level of the task
  createdAt: string; // Timestamp of when the task was created (ISO string format)
  updatedAt: string; // Timestamp of the last update (ISO string format)
  completionDate?: string; // Timestamp of when the task was completed (ISO string format)
  // Future enhancements could include:
  // subtasks: Task[];
  // recurring: boolean;
  // recurrenceRule: string; // e.g., RRule string
  // tags: string[];
}

export type TaskPriority = Task['priority'];

export interface TasksState {
  tasks: Task[]; // Array of task objects
  loading: boolean; // Indicates if tasks are currently being loaded or modified
  error: string | null; // Stores any error message related to task operations
}

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

// Example of a new task object structure, useful for creation forms
export interface NewTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  completed?: boolean;
  projectId?: string;
}
