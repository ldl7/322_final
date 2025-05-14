import { combineReducers } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice'; 
import { TasksState } from '../types/task'; 

// This will be our initial state shape
export interface RootState {
  // We'll add more state slices here as we create them
  app: {
    initialized: boolean;
  };
  tasks: TasksState; 
}

// A simple initial reducer (can be expanded or replaced later)
const appReducer = (state = { initialized: false }, _action: any) => {
  return state;
};

// Combine all reducers
export const rootReducer = combineReducers({
  app: appReducer,
  tasks: tasksReducer, 
});

export default rootReducer;
