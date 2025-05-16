/**
 * Authentication Controller
 * 
 * Handles user authentication including registration, login, token refresh, and logout.
 * Manages JWT token generation and refresh token rotation.
 * 
 * @module controllers/authController
 * @requires jsonwebtoken
 * @requires bcryptjs
 * @requires ../models/User
 * @requires ../utils/logger
 * @requires ../utils/validators
 * @requires ../config/config
 * 
 * @example
 * // Example routes that use this controller:
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - User login
 * POST /api/auth/refresh-token - Refresh access token
 * POST /api/auth/logout - Invalidate refresh token
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');
const httpStatusCodes = require('http-status-codes');
const config = require('../config/config'); // For cookie options

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    ...config.jwt.cookieOptions,
    maxAge: config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000, // in milliseconds
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, first_name, last_name } = req.body; // Using snake_case to match request body
    // Basic validation - more robust validation should be in middleware
    if (!username || !email || !password) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Username, email, and password are required.' });
    }

    const user = await authService.registerUser({ 
      username, 
      email, 
      password, 
      first_name, 
      last_name 
    });
    
    // Optionally, log the user in immediately and send tokens
    // For now, just return the created user, client can then proceed to login
    logger.info(`User registered: ${user.email}`);
    res.status(httpStatusCodes.CREATED).json(user); // User object is sanitized by toJSON in model
  } catch (error) {
    // Errors from authService (like BadRequestError for existing user) will be caught here
    // The global errorHandler middleware should handle ApiError instances
    next(error); 
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Email and password are required.' });
    }

    const { user, tokens } = await authService.loginUser(email, password);

    setRefreshTokenCookie(res, tokens.refreshToken);

    logger.info(`User logged in: ${user.email}`);
    res.status(httpStatusCodes.OK).json({
      accessToken: tokens.accessToken,
      user: user, // User object is sanitized by toJSON in model
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires valid refresh token cookie)
 */
const refreshToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(httpStatusCodes.UNAUTHORIZED).json({ message: 'Refresh token not found.' });
    }

    const newTokens = await authService.refreshAuthTokens(oldRefreshToken);

    setRefreshTokenCookie(res, newTokens.refreshToken);

    logger.info('Access token refreshed successfully.');
    res.status(httpStatusCodes.OK).json({
      accessToken: newTokens.accessToken,
    });
  } catch (error) {
    // If refresh token is invalid/expired, authService throws UnauthorizedError
    // Clear the cookie if the refresh token is bad
    if (error.statusCode === httpStatusCodes.UNAUTHORIZED || error.statusCode === httpStatusCodes.BAD_REQUEST) {
      res.clearCookie('refreshToken', config.jwt.cookieOptions);
    }
    next(error);
  }
};

/**
 * @desc    Logout user (invalidate refresh token)
 * @route   POST /api/auth/logout
 * @access  Private (requires authentication)
 */
const logout = async (req, res, next) => {
  try {
    // req.user.id should be available if a protect middleware has run
    const userId = req.user?.id; 
    if (!userId) {
      // This case should ideally not be hit if route is protected properly
      logger.warn('Logout attempt without authenticated user ID.');
      return res.status(httpStatusCodes.UNAUTHORIZED).json({ message: 'User not authenticated for logout.' });
    }

    await authService.logoutUser(userId);

    res.clearCookie('refreshToken', config.jwt.cookieOptions);
    
    logger.info(`User logged out: ${userId}`);
    res.status(httpStatusCodes.OK).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset (generates token and sends email - simulated)
 * @route   POST /api/auth/request-password-reset
 * @access  Public
 */
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Email is required.' });
    }

    const resetToken = await authService.requestPasswordReset(email);

    // In a real app, an email would be sent here with the resetToken.
    // For now, we'll just log it and send a success response.
    // The actual token is not sent back to the client for security reasons (it's in the email link).
    logger.info(`Password reset requested for email: ${email}. Token (for email link): ${resetToken}`);
    res.status(httpStatusCodes.OK).json({ message: 'If your email is registered, you will receive a password reset link shortly.' });
  } catch (error) {
    // To prevent email enumeration, we might want to always return a generic success message
    // even if the email is not found. The service throws NotFoundError if email doesn't exist.
    // For this implementation, if a NotFoundError is specifically for the user, we return the generic message.
    if (error.name === 'NotFoundError' && error.message.includes('User with this email not found')) {
        logger.warn(`Password reset attempt for non-existent email: ${req.body.email} - returning generic success`);
        return res.status(httpStatusCodes.OK).json({ message: 'If your email is registered, you will receive a password reset link shortly.' });
    }
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Token and new password are required.' });
    }

    await authService.resetPassword(token, newPassword);

    logger.info('Password has been reset successfully.');
    res.status(httpStatusCodes.OK).json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    // Handles invalid/expired token errors from the service
    next(error);
  }
};

/**
 * @desc    Request email verification link (simulated email sending)
 * @route   POST /api/auth/request-email-verification
 * @access  Private (requires authentication)
 */
const requestEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // Should be caught by protect middleware, but as a safeguard:
      return res.status(httpStatusCodes.UNAUTHORIZED).json({ message: 'User not authenticated.' });
    }

    const verificationToken = await authService.requestEmailVerification(userId);

    // In a real app, an email would be sent here with the verificationToken.
    logger.info(`Email verification requested for user: ${userId}. Token (for email link): ${verificationToken}`);
    res.status(httpStatusCodes.OK).json({ message: 'A new verification link has been sent to your email address (simulated).' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email using token
 * @route   GET /api/auth/verify-email/:token  (GET is common for clicking a link)
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Verification token is required.' });
    }

    await authService.verifyEmail(token);

    logger.info('Email verified successfully.');
    // In a real app, you might redirect to a 'verified successfully' page or login.
    res.status(httpStatusCodes.OK).json({ message: 'Email has been verified successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
};
