# AI Coach Chat Application

A real-time chat application with AI coaching capabilities, built with React Native for the mobile frontend and Node.js/Express for the backend.

## Features

- Real-time messaging using WebSockets
- AI coach responses to user messages
- Secure authentication with JWT
- Modern, responsive UI
- Optimistic UI updates for a smooth user experience

## Getting Started

### Backend Setup

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the server: `npm start`

### Mobile App Setup

1. Navigate to the mobile app directory: `cd mobile-app`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Run on iOS: `npm run ios` or Android: `npm run android`

## Project Structure

- `/mobile-app` - React Native mobile application
  - `/src/screens` - Application screens
  - `/src/services` - API and WebSocket services
  - `/src/components` - Reusable UI components
- `/backend` - Node.js/Express backend server
  - `/controllers` - Request handlers
  - `/models` - Database models
  - `/services` - Business logic
  - `/routes` - API routes
  - `/middleware` - Express middleware

## WebSocket Implementation

### Frontend

The frontend uses Socket.IO client to establish a real-time connection with the backend:

- `socketService.ts` - Manages the WebSocket connection lifecycle
- `ChatScreen.tsx` - Implements WebSocket event listeners for real-time message updates

### Backend

The backend uses Socket.IO to broadcast messages to connected clients:

- Authentication middleware validates JWT tokens for secure connections
- Messages are broadcast to conversation-specific rooms
- AI responses are sent in real-time to clients

## Best Practices Implemented

- **Clean Code**: Modular architecture with separation of concerns
- **SOLID Principles**: Single responsibility and interface segregation
- **Type Safety**: TypeScript interfaces for data models
- **Error Handling**: Comprehensive error handling throughout the application
- **Optimistic Updates**: UI updates immediately with optimistic changes
- **Real-time Communication**: Efficient WebSocket implementation
- **Security**: JWT authentication for API and WebSocket connections

## License

MIT License - See LICENSE file for details
