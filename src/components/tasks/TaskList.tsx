/**
 * TaskList.tsx
 *
 * A component responsible for rendering a list of task items.
 * 
 * Features:
 * - Displays tasks in a scrollable FlatList
 * - Handles empty states with appropriate messaging
 * - Supports pull-to-refresh functionality
 * - Implements filtering and sorting options
 * - Uses virtualization for performance with large lists
 * - Connects to Redux store to retrieve task data
 *
 * This component serves as a container for TaskItem components and
 * manages the presentation logic for the entire task list.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { selectTasks, selectTasksLoading, selectTasksError } from '../../store/selectors/taskSelectors';
import { fetchTasks } from '../../store/actions/taskActions';
import { Task } from '../../types/task';
import TaskItem from './TaskItem';
import { TaskFilter } from './TaskFilterBar';

interface TaskListProps {
  activeFilter: TaskFilter;
}

const TaskList: React.FC<TaskListProps> = ({ activeFilter }) => {
  const dispatch: AppDispatch = useDispatch();
  const allTasks = useSelector(selectTasks);
  const isLoading = useSelector(selectTasksLoading);
  const error = useSelector(selectTasksError);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const filteredTasks = useMemo(() => {
    console.log('Filtering tasks with filter:', activeFilter);
    if (activeFilter === 'active') {
      return allTasks.filter(task => !task.completed);
    } else if (activeFilter === 'completedToday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

      return allTasks.filter(task => {
        if (!task.completed || !task.completionDate) return false;
        const completionDate = new Date(task.completionDate);
        return completionDate >= today && completionDate < tomorrow;
      });
    }
    return allTasks; // Should not happen if activeFilter is always valid
  }, [allTasks, activeFilter]);

  const renderItem = ({ item }: { item: Task }) => (
    <TaskItem 
      task={item} 
      showCheckmark={activeFilter === 'active'}
    />
  );

  const onRefresh = () => {
    dispatch(fetchTasks());
  };

  if (isLoading && allTasks.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading tasks: {error}</Text>
        <Text style={styles.retryText} onPress={onRefresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (filteredTasks.length === 0) {
    let emptyMessage = 'No tasks yet. Add one!';
    if (activeFilter === 'active') {
      emptyMessage = 'No active tasks. Great job, or add a new one!';
    } else if (activeFilter === 'completedToday') {
      emptyMessage = 'No tasks completed today. Keep going!';
    }
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    color: '#1976d2',
    marginTop: 10,
    padding: 8,
    textDecorationLine: 'underline',
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listContentContainer: {
    paddingBottom: 20, // Ensure space for the last item and Add button
  },
});

export default TaskList;
