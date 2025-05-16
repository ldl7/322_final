# ADHD Coach Application - File Structure Documentation

## Overview
This document outlines the purpose of each file in the AI-powered ADHD Coach application structure.

## Mobile App (/mobile-app)

### Core Files
- `src/App.js`: Main application component that serves as the entry point for the ADHD Coach mobile app. Handles routing, global state management, and overall app configuration.
- `src/index.js`: Entry point for the React Native application. Initializes the app and connects it to the native platform.
- `src/app.json`: Application configuration file containing settings for app name, version, and other metadata.
- `src/package.json`: Package information and dependencies for the mobile application.

### Components
#### Conversation
- `src/components/Conversation/ConversationContainer.js`: Container component that manages the chat interface between the user and the AI coach.
- `src/components/Conversation/MessageBubble.js`: UI component for rendering individual messages in the conversation.
- `src/components/Conversation/EmotionIndicator.js`: Component that visualizes the detected emotional state of the user based on their messages.

#### Task Management
- `src/components/TaskManagement/TaskList.js`: Component for displaying and managing the user's tasks and to-do items.
- `src/components/TaskManagement/TaskBreakdown.js`: Component that helps break down complex tasks into smaller, manageable steps.
- `src/components/TaskManagement/Calendar.js`: Calendar view for scheduling and visualizing tasks over time.

#### Gamification
- `src/components/Gamification/RewardSystem.js`: Implements the reward and point system to motivate users to complete tasks.
- `src/components/Gamification/ProgressTracker.js`: Visualizes the user's progress and achievements over time.

#### Common
- `src/components/Common/Button.js`: Reusable button component with consistent styling across the app.
- `src/components/Common/Modal.js`: Reusable modal dialog component for confirmations and notifications.

### Navigation
- `src/navigation/AppNavigator.js`: Handles screen navigation and routing throughout the application.

### Screens
- `src/screens/Dashboard.js`: Main dashboard screen showing overview of tasks, mood, and progress.

### Context
- `src/contexts/UserContext.js`: Context provider for user-related state management.
- `src/contexts/TaskContext.js`: Context provider for task-related state management.
- `src/contexts/EmotionalStateContext.js`: Context provider for tracking the user's emotional state.

### Hooks
- `src/hooks/useConversation.js`: Custom hook for managing conversation state and interactions with the AI.

## Backend (/backend)

### API
#### Routes
- `src/api/routes/conversationRoutes.js`: API endpoints for conversation-related actions.
- `src/api/routes/taskRoutes.js`: API endpoints for task management actions.
- `src/api/routes/userRoutes.js`: API endpoints for user account management.

#### Controllers
- `src/api/controllers/conversationController.js`: Handles business logic for conversation-related API requests.
- `src/api/controllers/taskController.js`: Handles business logic for task management API requests.
- `src/api/controllers/userController.js`: Handles business logic for user management API requests.

#### Middleware
- `src/api/middlewares/auth.js`: Authentication middleware to verify user identity and permissions.
- `src/api/middlewares/errorHandler.js`: Global error handling middleware for API requests.

### Services
#### AI Services
- `src/services/ai/languageModel.js`: Service for interacting with the OpenAI language model.
- `src/services/ai/emotionDetection.js`: Service for detecting and analyzing user emotions from text.
- `src/services/ai/adaptiveCoaching.js`: Service that adapts coaching strategies based on user behavior and needs.

#### Task Services
- `src/services/task/taskBreakdown.js`: Service for breaking down complex tasks into manageable steps.
- `src/services/task/reminderService.js`: Service for managing task reminders and notifications.

#### User Services
- `src/services/user/profileService.js`: Service for managing user profile information.
- `src/services/user/preferencesService.js`: Service for managing user preferences and settings.

### Models
- `src/models/User.js`: Data model for user accounts and profiles.
- `src/models/Task.js`: Data model for tasks and to-do items.
- `src/models/Conversation.js`: Data model for storing conversation history.
- `src/models/EmotionalState.js`: Data model for tracking user emotional states over time.

## OpenAI Integration (/openai-integration)

### Services
- `src/services/openaiService.js`: Core service for communicating with the OpenAI API.
- `src/services/promptManager.js`: Service for managing and optimizing prompts sent to the OpenAI API.
- `src/services/contextManager.js`: Service for managing conversation context and history for the OpenAI API.

### Configuration
- `src/config/openaiConfig.js`: Configuration settings for the OpenAI API integration.

## Security (/security)

### API Key Management
- `src/apiKey/keyManager.js`: Service for securely managing and rotating OpenAI API keys.

### Proxy
- `src/proxy/openaiProxy.js`: Proxy service for securely routing OpenAI API requests.

### Monitoring
- `src/monitoring/usageMonitor.js`: Service for monitoring and controlling OpenAI API usage and costs.
