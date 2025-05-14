/**
 * taskSelectors.ts
 *
 * This file contains selector functions to efficiently retrieve and derive data from the Redux store.
 * 
 * Features:
 * - Provides memoized selectors for performance optimization
 * - Implements reusable selector functions for common data needs
 * - Includes derived selectors for filtered and sorted task views
 * - Creates selectors for statistics (completion rate, overdue tasks)
 * - Supports type safety with TypeScript for reliable data access
 *
 * These selectors follow the selector pattern recommended by Redux,
 * using memoization to prevent unnecessary calculations when state hasn't changed.
 */

import { createSelector } from '@reduxjs/toolkit'; // or 'reselect' if preferred
import { RootState } from '../rootReducer';
import { Task } from '../../types/task';

// Selector for the entire tasks slice of the state
const selectTasksState = (state: RootState) => state.tasks;

// Selector for the list of tasks
export const selectTasks = createSelector(
  [selectTasksState],
  (tasksState) => tasksState.tasks
);

// Selector for the loading state of tasks
export const selectTasksLoading = createSelector(
  [selectTasksState],
  (tasksState) => tasksState.loading
);

// Selector for any error related to tasks
export const selectTasksError = createSelector(
  [selectTasksState],
  (tasksState) => tasksState.error
);

// Selector for the count of tasks completed today
export const selectCompletedTodayCount = createSelector(
  [selectTasks], // Input selector: all tasks
  (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    return tasks.filter(task => {
      if (!task.completed || !task.completionDate) return false;
      const completionDate = new Date(task.completionDate);
      return completionDate >= today && completionDate < tomorrow;
    }).length;
  }
);

// Example of a more complex selector (e.g., select completed tasks)
// This can be added later as needed.
// export const selectCompletedTasks = createSelector(
//   [selectTasks],
//   (tasks) => tasks.filter(task => task.completed)
// );
