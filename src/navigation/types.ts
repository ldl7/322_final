/**
 * types.ts
 * 
 * This file defines TypeScript type definitions for the navigation system.
 * It includes:
 * - Route parameter lists for each screen
 * - Navigation prop types
 * - Screen option types
 * - Navigation state types
 * 
 * These types ensure type safety throughout the navigation system.
 */

// types.ts - Navigation types will go here

// Define the parameter list for each screen in the bottom tab navigator
export type BottomTabParamList = {
  Tasks: undefined; // No parameters expected for Tasks screen
  Chat: undefined; // No parameters expected for Chat screen
  Tamagotchi: undefined; // No parameters expected for Tamagotchi screen
  Settings: undefined; // No parameters expected for Settings screen
};

// You can extend this with types for other navigators (e.g., StackNavigator)
// For example:
// export type AuthStackParamList = {
//   Login: undefined;
//   Register: undefined;
// };

// export type AppStackParamList = {
//   Home: NavigatorScreenParams<BottomTabParamList>;
//   Profile: { userId: string };
// };

// Helper types for screen props
// import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
// import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';

// export type TasksScreenProps = BottomTabScreenProps<BottomTabParamList, 'Tasks'>;
// export type ChatScreenProps = BottomTabScreenProps<BottomTabParamList, 'Chat'>;
// export type TamagotchiScreenProps = BottomTabScreenProps<BottomTabParamList, 'Tamagotchi'>;
// export type SettingsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Settings'>;
