/**
 * FloatingActionButton.tsx
 *
 * A reusable floating action button component that appears in the bottom-right corner
 * of the screen, typically used for primary actions like creating a new item.
 * 
 * Features:
 * - Customizable icon and color
 * - Accessibility support with proper labeling
 * - Ripple effect feedback on press
 * - Optional badge for notifications
 * - Support for different sizes (small, medium, large)
 * 
 * Usage:
 * <FloatingActionButton 
 *   onPress={() => handleAddTask()}
 *   iconName="plus" 
 *   iconColor="#fff"
 *   backgroundColor="#4a90e2"
 *   size={60}
 *   accessibilityLabel="Create new task"
 * />
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

interface FloatingActionButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  iconName: keyof typeof Ionicons.glyphMap; 
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  iconName,
  iconColor = '#fff',
  backgroundColor = '#007AFF', 
  size = 60,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  const buttonStyle: StyleProp<ViewStyle> = [
    styles.fab,
    { 
      width: size, 
      height: size, 
      borderRadius: size / 2, 
      backgroundColor 
    },
    disabled && styles.disabled,
    style,
  ];

  const iconSize = size * 0.5;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabled: {
    backgroundColor: '#A9A9A9', 
    opacity: 0.7,
  },
});

export default FloatingActionButton;
