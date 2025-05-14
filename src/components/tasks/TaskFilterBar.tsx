/**
 * TaskFilterBar.tsx
 *
 * A component that provides filtering options for the task list, allowing users
 * to toggle between viewing active tasks and tasks completed on the current day.
 * 
 * Features:
 * - Toggle buttons for filtering tasks (Active/Today's Completed)
 * - Visual indicators for the currently selected filter
 * - Animated transitions between filter states (Future enhancement)
 * - Accessibility support with proper labeling
 * - Responsive design that adapts to different screen sizes
 * 
 * The component emits events when filters are changed, allowing parent components
 * to update their state and re-render filtered content accordingly.
 * 
 * Usage:
 * <TaskFilterBar
 *   activeFilter="active" // or "completedToday"
 *   onFilterChange={(filter) => handleFilterChange(filter)}
 *   showCompletedCount={true} // Prop name updated for clarity
 *   completedCount={5}
 * />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export type TaskFilter = 'active' | 'completedToday';

interface TaskFilterBarProps {
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  completedCount?: number;
  style?: StyleProp<ViewStyle>;
}

const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  activeFilter,
  onFilterChange,
  completedCount = 0,
  style,
}) => {
  const filters: { label: string; value: TaskFilter }[] = [
    { label: 'Active', value: 'active' },
    { label: `Today's Completed`, value: 'completedToday' },
  ];

  return (
    <View style={[styles.container, style]}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              isActive && styles.activeFilterButton,
            ]}
            onPress={() => onFilterChange(filter.value)}
            accessibilityLabel={`Filter tasks by ${filter.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.filterButtonText,
                isActive && styles.activeFilterButtonText,
              ]}
            >
              {filter.label}
            </Text>
            {filter.value === 'completedToday' && completedCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{completedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0', // Light gray background
    borderRadius: 25, // Rounded corners for the bar
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  filterButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 18, // Increased padding for better touch area
    borderRadius: 20, // Rounded corners for buttons
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF', // iOS blue for active filter
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF', // Text color for inactive buttons
  },
  activeFilterButtonText: {
    color: '#FFFFFF', // White text for active button
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: '#FF3B30', // iOS red for badge
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TaskFilterBar;
