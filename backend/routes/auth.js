/**
 * Authentication Routes
 * 
 * Defines all authentication-related API endpoints.
 * Handles user registration, login, token refresh, and logout.
 * 
 * @module routes/auth
 * @requires express
 * @requires ../controllers/authController
 * @requires ../middleware/validation
 * @requires ../middleware/auth
 * 
 * @example
 * // Example usage in Express app:
 * const authRoutes = require('./routes/auth');
 * app.use('/api/auth', authRoutes);
 */

// File will be implemented with routes for:
// 1. POST /register - Register a new user
// 2. POST /login - User login with credentials
// 3. POST /refresh-token - Refresh access token
// 4. POST /logout - Invalidate refresh token
// 5. POST /forgot-password - Request password reset
// 6. POST /reset-password - Reset password with token

// Implementation will include proper route validation and error handling
