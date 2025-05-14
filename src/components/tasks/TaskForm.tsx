/**
 * TaskForm.tsx
 *
 * A form component for creating new tasks and editing existing ones.
 * 
 * Features:
 * - Provides input fields for all task properties (title, description, due date, priority)
 * - Implements form validation with helpful error messages
 * - Supports both creation and edit modes
 * - Includes date picker for selecting due dates
 * - Offers priority selection via radio buttons or dropdown
 * - Connects to Redux to dispatch task actions
 *
 * This component follows form best practices with proper validation,
 * accessibility, and user feedback for a smooth task management experience.
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../store/store';
import { addTask } from '../../store/actions/taskActions';
import { NewTask, Task, TaskPriority } from '../../types/task';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';

interface TaskFormProps {
  onSuccess?: () => void;
  initialTask?: Partial<Task>;
  submitButtonText?: string;
  onDismiss?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  onSuccess,
  initialTask,
  submitButtonText = 'Add Task',
  onDismiss,
}) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | null>(initialTask?.dueDate ? new Date(initialTask.dueDate) : null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [errors, setErrors] = useState<{title?: string}>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: {title?: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const newTaskData: NewTask = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate?.toISOString(),
      completed: false,
    };

    dispatch(addTask(newTaskData))
      .unwrap()
      .then(() => {
        if (!initialTask) {
          // Only clear if it's a new task form
          setTitle('');
          setDescription('');
          setPriority('medium');
          setDueDate(null);
        }
        onSuccess?.();
      })
      .catch((error) => {
        Alert.alert('Error', error.message || 'Failed to save task');
      });
  }, [title, description, priority, dueDate, validateForm, dispatch, onSuccess, initialTask]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowCalendar(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Enter task title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({});
            }}
            maxLength={100}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.row}>
            <View style={[styles.column, { marginRight: 8 }]}>
              <Text style={styles.label}>Priority</Text>
              <View style={[styles.pickerContainer]}>
                <Picker
                  selectedValue={priority}
                  onValueChange={(itemValue: TaskPriority | string) => 
                    setPriority(itemValue as TaskPriority)
                  }
                  style={styles.picker}
                  dropdownIconColor="#666"
                  mode="dropdown"
                >
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="Low" value="low" />
                </Picker>
              </View>
            </View>

            <View style={[styles.column, styles.datePickerContainer]}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Text style={styles.dateText}>
                  {dueDate ? dueDate.toLocaleDateString() : 'Select date'}
                </Text>
                <Ionicons 
                  name={showCalendar ? 'calendar' : 'calendar-outline'}
                  size={20} 
                  color="#666"
                  style={styles.calendarIcon}
                />
              </TouchableOpacity>
              {showCalendar && (
                <View style={styles.calendarContainer}>
                  <Calendar
                    onDayPress={(day) => {
                      setDueDate(new Date(day.timestamp));
                      setShowCalendar(false);
                    }}
                    minDate={new Date().toISOString()}
                    theme={{
                      backgroundColor: '#ffffff',
                      calendarBackground: '#ffffff',
                      textSectionTitleColor: '#b6c1cd',
                      selectedDayBackgroundColor: '#3498db',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#3498db',
                      dayTextColor: '#2d4150',
                      textDisabledColor: '#d9e1e8',
                      dotColor: '#3498db',
                      selectedDotColor: '#ffffff',
                      arrowColor: '#3498db',
                      monthTextColor: '#3498db',
                      textMonthFontWeight: 'bold',
                      textDayFontSize: 16,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 16
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.calendarCloseButton}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={styles.calendarCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>{submitButtonText}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    marginTop: -12,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  pickerContainer: {
    padding: 0,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    width: '100%',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
    backgroundColor: '#f9f9f9',
  },
  calendarIcon: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    position: 'relative',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
    alignSelf: 'center',
  },
  calendarCloseButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  calendarCloseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  datePickerContainer: {
    position: 'relative',
    zIndex: 1001,
  },
});

export default TaskForm;
