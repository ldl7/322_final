/**
 * AppNavigator.tsx
 * 
 * This file contains the main navigation structure for the Coach Ally application.
 * It defines the bottom tab navigator and routes to the main screens:
 * Tasks, Chat, Tamagotchi, and Settings.
 * 
 * The navigator handles transitions between screens and maintains navigation state.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import TasksScreen from '../screens/TasksScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import TamagotchiScreen from '../screens/Tamagotchi/TamagotchiScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          if (route.name === 'Tasks') {
            iconName = focused ? 'check-all' : 'check-all';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chat' : 'chat-outline';
          } else if (route.name === 'Tamagotchi') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          // You can return any component that you like here!
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato', // Example active color
        tabBarInactiveTintColor: 'gray',   // Example inactive color
        headerShown: true, // Show header for screens, can be customized per screen
      })}
    >
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Tamagotchi" component={TamagotchiScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
