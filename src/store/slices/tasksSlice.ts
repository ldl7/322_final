/**
 * tasksSlice.ts
 * 
 * Redux slice for task management functionality:
 * - Defines the task state interface and initial state
 * - Implements reducers for CRUD operations on tasks:
 *   - Adding new tasks
 *   - Updating existing tasks
 *   - Marking tasks as complete/incomplete
 *   - Deleting tasks
 *   - Setting recurring tasks
 *   - Filtering and sorting tasks
 * - Exports action creators and the reducer
 * - Includes selectors for accessing task state
 * 
 * This slice integrates with the SQLite service for data persistence.
 */
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, TaskPriority, NewTask } from '../../types/task';
import { fetchTasks, addTask, toggleTask, deleteTask } from '../actions/taskActions';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handle fetchTasks
    builder.addCase(fetchTasks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchTasks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Failed to load tasks';
    });

    // Handle addTask
    builder.addCase(addTask.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      state.loading = false;
    });
    builder.addCase(addTask.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Failed to add task';
    });

    // Handle toggleTask
    builder.addCase(toggleTask.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(toggleTask.fulfilled, (state, action: PayloadAction<Partial<Task>>) => {
      const updatedFields = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.id === updatedFields.id);
      if (taskIndex !== -1) {
        // Merge the updated fields into the existing task
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updatedFields };
      }
      state.loading = false;
    });
    builder.addCase(toggleTask.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Failed to toggle task';
    });

    // Handle deleteTask
    builder.addCase(deleteTask.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      state.loading = false;
    });
    builder.addCase(deleteTask.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string || 'Failed to delete task';
    });
  },
});

export default tasksSlice.reducer;
