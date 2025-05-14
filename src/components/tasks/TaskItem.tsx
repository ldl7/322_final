/**
 * TaskItem.tsx
 *
 * A reusable component that displays a single task item in the list.
 * 
 * Features:
 * - Renders task details (title, description, due date, priority)
 * - Provides a checkbox to toggle task completion status
 * - Includes swipe actions for quick editing and deletion
 * - Displays visual indicators for priority levels
 * - Handles overdue task styling
 * - Implements proper accessibility features
 *
 * This component is responsible for the presentation and interaction
 * with individual task items, following a consistent design system.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useDispatch } from 'react-redux';
import { Task } from '../../types/task';
import { toggleTask, deleteTask } from '../../store/actions/taskActions';
import { useAppDispatch } from '../../store/store'; 

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
  showCheckmark?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, showCheckmark = false }) => {
  const dispatch = useAppDispatch();

  const handleToggleComplete = () => {
    if (task.id) {
      dispatch(toggleTask({ taskId: task.id, completed: !task.completed }));
    }
  };

  const handlePress = (e: GestureResponderEvent) => {
    // Only toggle if the press is not on the delete button
    if (e.target !== e.currentTarget) {
      onEdit?.(task);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (task.id) {
              dispatch(deleteTask(task.id));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, task.completed && styles.completedContainer]}>
      {/* Delete Button - Moved to the left */}
      <TouchableOpacity 
        onPress={handleDelete} 
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
      </TouchableOpacity>

      {/* Info Container - Takes remaining space, includes completion toggle */}
      <TouchableOpacity 
        onPress={handlePress} // This now primarily serves for onEdit
        style={styles.infoContainer}
        activeOpacity={0.7}
      >
        <View style={styles.mainContentContainer}> 
          <View style={styles.header}>
            <Text 
              style={[
                styles.title,
                task.completed && styles.completedText
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {task.title}
            </Text>
            <Text style={styles.priority}>
              {task.priority?.toUpperCase() || 'NORMAL'}
            </Text>
          </View>
          
          {task.description && (
            <Text 
              style={[
                styles.description, 
                task.completed && styles.completedText
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {task.description}
            </Text>
          )}
          
          <View style={styles.footer}>
            {/* Removed old status text - will be replaced by icon toggle */}
            {task.dueDate && (
              <Text style={styles.dueDate}>
                <Ionicons name="calendar-outline" size={12} color="#888" /> {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Completion Toggle - Positioned to the right, within the bounds of the old delete button's visual space */}
      <TouchableOpacity 
        onPress={handleToggleComplete} 
        style={styles.completionToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={task.completed ? "Mark as incomplete" : "Mark as complete"}
        accessibilityRole="button"
      >
        <View style={[
          styles.completionRing,
          task.completed && styles.completedRing
        ]}>
          {showCheckmark && (
            <Ionicons 
              name="checkmark"
              size={20} 
              color={"#ffffff"}
              style={styles.checkIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 16, // Adjusted padding
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Softer shadow
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 2, // Softer shadow
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically
    overflow: 'hidden',
  },
  completedContainer: {
    backgroundColor: '#f0f0f0', // Lighter completed background
    opacity: 0.9, // Slightly less opaque
  },
  deleteButton: {
    paddingVertical: 8, // Consistent vertical padding
    paddingRight: 12, // Space between delete and info
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center', // Center content vertically if it's shorter
  },
  mainContentContainer: { // New wrapper for text content, to allow completion toggle to be separate
    flex: 1, // takes available space if infoContainer had other siblings horizontally
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4, // Reduced margin
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6, // Reduced margin
  },
  title: {
    flex: 1,
    fontSize: 17, // Slightly larger title
    fontWeight: '600',
    color: '#2c3e50', // Darker title
    marginRight: 8,
  },
  priority: {
    fontSize: 11, // Smaller priority text
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#3498db', // Example color
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 4, // Add some space if title is long
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d', // Softer description color
    marginVertical: 2, // Reduced margin
    lineHeight: 18, // Adjusted line height
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
    display: 'flex', // For icon alignment
    alignItems: 'center', // For icon alignment
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#bdc3c7', // Lighter completed text
  },
  completionToggle: {
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // Add a slight touch target expansion
    minWidth: 50,
    minHeight: 50,
  },
  completionRing: {
    width: 32,
    height: 32,
    borderRadius: 16, // Make it circular
    backgroundColor: '#3498db', // Blue color for the ring
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  completedRing: {
    backgroundColor: '#2ecc71', // Green when completed
    borderColor: '#2ecc71',
  },
  checkIcon: {
    // Position the checkmark in the center of the ring
    alignSelf: 'center',
    // Add text shadow for better visibility
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default TaskItem;
