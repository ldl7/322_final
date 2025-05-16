# Coach Ally Backend

## Project Structure

```
backend/
├── config/               # Configuration files
├── controllers/          # Request handlers
├── middleware/           # Express middleware
├── models/               # Sequelize models
├── routes/               # API routes
├── services/             # Business logic
├── utils/                # Utility functions
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── .sequelizerc          # Sequelize configuration
└── server.js             # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values
4. Create a PostgreSQL database
5. Run migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

See `.env.example` for all required environment variables.

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user
- `DELETE /api/users/me` - Delete current user

### Conversations

- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details
- `PUT /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages

- `GET /api/messages?conversationId=:id` - Get messages in conversation
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

## Development

### Scripts

- `npm run dev` - Start development server with hot-reload
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- JSDoc for documentation

## Deployment

### Production

1. Set `NODE_ENV=production`
2. Update database and other environment variables
3. Run migrations
4. Start the server with a process manager like PM2

## License

This project is licensed under the MIT License.
