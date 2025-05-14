/**
 * Modal.tsx
 *
 * A reusable modal component that displays content over the current screen.
 * This component follows React Native best practices and SOLID principles.
 * 
 * Features:
 * - Backdrop with customizable opacity and color
 * - Animated entrance and exit transitions (via React Native's Modal component)
 * - Support for different modal positions (center, bottom, top) - Centered by default for this implementation
 * - Close on backdrop tap option
 * - Hardware back button handling (Android - via React Native's Modal component)
 * - Keyboard avoiding behavior (can be added by wrapping children with KeyboardAvoidingView)
 * - Accessibility support with proper focus management (leveraging React Native's Modal)
 * - Compatible with both portrait and landscape orientations
 * 
 * Performance Considerations:
 * - Uses React.memo to prevent unnecessary re-renders if props are stable.
 * - Leverages the optimized React Native Modal component.
 * 
 * Error Handling:
 * - Parent component is responsible for error boundaries around children.
 * 
 * Usage:
 * <Modal
 *   visible={isModalVisible}
 *   onClose={() => setModalVisible(false)}
 *   animationType="fade"
 *   closeOnBackdropPress={true}
 * >
 *   <View style={styles.modalContentExample}> // Example style for content
 *     <Text>Your modal content goes here</Text>
 *     <Button title="Close" onPress={() => setModalVisible(false)} />
 *   </View>
 * </Modal>
 */

import React from 'react';
import {
  Modal as ReactNativeModal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  Keyboard,
  Platform,
} from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  closeOnBackdropPress?: boolean;
  backdropColor?: string;
  backdropOpacity?: number;
  containerStyle?: StyleProp<ViewStyle>; // Style for the view that centers the content box
  contentStyle?: StyleProp<ViewStyle>;   // Style for the actual content box
}

const Modal: React.FC<ModalProps> = React.memo(
  ({
    visible,
    onClose,
    children,
    animationType = 'fade',
    transparent = true,
    closeOnBackdropPress = true,
    backdropColor = 'black',
    backdropOpacity = 0.5,
    containerStyle,
    contentStyle,
  }) => {
    const handleBackdropPress = () => {
      if (closeOnBackdropPress) {
        Keyboard.dismiss(); // Dismiss keyboard if open
        onClose();
      }
    };

    return (
      <ReactNativeModal
        visible={visible}
        onRequestClose={onClose} // Handles Android back button
        animationType={animationType}
        transparent={transparent}
        statusBarTranslucent // Allows modal to go over status bar
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress} accessible={false}>
          <View 
            style={[
              styles.backdrop,
              { backgroundColor: backdropColor, opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContainer, containerStyle]} pointerEvents="box-none">
          {/* The content itself should not be pressable to close unless explicitly handled by children */} 
          <View style={[styles.contentBox, contentStyle]}>
            {children}
          </View>
        </View>
      </ReactNativeModal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // Default to center position
    alignItems: 'center',
    padding: 20, // Ensure content doesn't touch screen edges
  },
  contentBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Ensure children with own scrolling work as expected
    overflow: Platform.OS === 'android' ? 'hidden' : undefined, // Fix for Android borderRadius with shadow
  },
  // Example style mentioned in usage comments, not part of the component itself
  /* modalContentExample: {
    alignItems: 'center',
  }, */
});

export default Modal;
