/**
 * Authentication Service
 * 
 * Handles core authentication logic including user registration, login,
 * token generation, and password management.
 * 
 * @module services/authService
 * @requires bcryptjs
 * @requires jsonwebtoken
 * @requires ../models/User
 * @requires ../config/config
 * @requires ../utils/logger
 * @requires ../utils/errors
 * 
 * @example
 * // Example usage:
 * const { registerUser, loginUser } = require('../services/authService');
 * const user = await registerUser(userData);
 * const tokens = await loginUser(email, password);
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Assuming models/index.js exports models
const config = require('../config/config');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { ApiError, SMTPEror, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../utils/errors'); // Assuming custom errors
const httpStatusCodes = require('http-status-codes');

/**
 * Registers a new user.
 * @param {object} userData - The user data (username, email, password, firstName, lastName).
 * @returns {Promise<User>} The created user object (without sensitive data).
 * @throws {ApiError} If email or username already exists, or on other validation errors.
 */
const registerUser = async (userData) => {
  const { email, username, password, first_name, last_name } = userData;

  // Check if email or username already exists
  const existingUserByEmail = await User.findOne({ where: { email } });
  if (existingUserByEmail) {
    throw new BadRequestError('Email address is already in use.');
  }

  const existingUserByUsername = await User.findOne({ where: { username } });
  if (existingUserByUsername) {
    throw new BadRequestError('Username is already taken.');
  }

  try {
    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      role: 'user',
      is_email_verified: false,
    });
    logger.info(`User registered successfully: ${user.email}`);
    // The toJSON method in the User model should handle removing sensitive fields.
    return user; 
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // Extract meaningful messages from Sequelize errors
      const messages = error.errors.map(e => e.message).join(', ');
      logger.error(`Validation error during registration: ${messages}`);
      throw new BadRequestError(`Registration failed: ${messages}`);
    }    
    logger.error(`Error registering user: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred during registration.');
  }
};

/**
 * Logs in an existing user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{user: User, tokens: {accessToken: string, refreshToken: string}}>} User object and tokens.
 * @throws {ApiError} If login fails (e.g., invalid credentials, user not found).
 */
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new BadRequestError('Email and password are required.');
  }

  // Find user by email, including sensitive info for password comparison
  const user = await User.scope('withSensitiveData').findOne({ where: { email } });

  if (!user) {
    logger.warn(`Login attempt failed for non-existent email: ${email}`);
    throw new UnauthorizedError('Invalid email or password.');
  }

  // Compare password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    logger.warn(`Login attempt failed for user ${email}: Incorrect password.`);
    throw new UnauthorizedError('Invalid email or password.');
  }

  // Generate tokens
  const tokens = await user.generateAuthTokens();

  // Update lastLogin timestamp
  user.lastLogin = new Date();
  await user.save({ fields: ['lastLogin'] }); // Only update lastLogin

  logger.info(`User logged in successfully: ${user.email}`);
  // The user object returned here will be serialized by its toJSON method (or defaultScope if not overridden by toJSON)
  return { user, tokens }; 
};

/**
 * Refreshes authentication tokens using a refresh token.
 * @param {string} oldRefreshToken - The refresh token to be verified.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} New access and refresh tokens.
 * @throws {ApiError} If the refresh token is invalid, expired, or not found.
 */
const refreshAuthTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new BadRequestError('Refresh token is required.');
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(oldRefreshToken, config.jwt.refreshSecret);
    
    // Find user by ID from token, including sensitive info to check stored refresh token
    const user = await User.scope('withSensitiveInfo').findByPk(decoded.id);

    if (!user) {
      logger.warn(`Refresh token verification failed: User ${decoded.id} not found.`);
      throw new UnauthorizedError('Invalid refresh token: User not found.');
    }

    // Check if the provided refresh token matches the one stored in the database
    if (user.refreshToken !== oldRefreshToken) {
      logger.warn(`Refresh token mismatch for user ${user.email}. Possible token reuse or old token.`);
      // Optionally, invalidate all user sessions here for security
      // user.refreshToken = null;
      // await user.save();
      throw new UnauthorizedError('Invalid refresh token: Token has been invalidated or is old.');
    }

    // Generate new tokens (this will also save the new refresh token to the user model)
    const newTokens = await user.generateAuthTokens();
    logger.info(`Tokens refreshed successfully for user: ${user.email}`);
    return newTokens;

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedError(`Invalid or expired refresh token: ${error.message}`);
    }
    logger.error(`Error refreshing tokens: ${error.message}`, { stack: error.stack });
    // If it's an error we threw (like UnauthorizedError from user not found/token mismatch), rethrow it
    if (error instanceof ApiError) {
        throw error;
    }
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while refreshing tokens.');
  }
};

/**
 * Logs out a user by invalidating their refresh token.
 * @param {string} userId - The ID of the user to log out.
 * @returns {Promise<void>}
 * @throws {ApiError} If the user is not found or an error occurs.
 */
const logoutUser = async (userId) => {
  if (!userId) {
    throw new BadRequestError('User ID is required for logout.');
  }

  const user = await User.scope('withSensitiveInfo').findByPk(userId);

  if (!user) {
    // This case might be debatable: if user doesn't exist, are they 'logged out'? 
    // For security, treating as an error or logging is fine.
    logger.warn(`Logout attempt for non-existent user ID: ${userId}`);
    throw new NotFoundError('User not found, cannot logout.');
  }

  // Invalidate the refresh token
  user.refreshToken = null;
  try {
    await user.save({ fields: ['refreshToken'] });
    logger.info(`User logged out successfully: ${user.email}`);
  } catch (error) {
    logger.error(`Error during logout for user ${user.email}: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred during logout.');
  }
};

/**
 * Generates a password reset token for a user and stores its hash.
 * (In a real app, this would also trigger sending an email with the plain token).
 * @param {string} email - The email of the user requesting a password reset.
 * @returns {Promise<string>} The plain password reset token (for email sending).
 * @throws {ApiError} If the user is not found or an error occurs.
 */
const requestPasswordReset = async (email) => {
  if (!email) {
    throw new BadRequestError('Email is required to request a password reset.');
  }

  const user = await User.scope('withSensitiveInfo').findOne({ where: { email } });

  if (!user) {
    // Do not reveal if the user exists or not for security reasons.
    // Log it, but return a generic success-like message or handle it in the controller.
    logger.info(`Password reset request for non-existent email: ${email}`);
    // To prevent email enumeration, you might not want to throw an error here that indicates the user doesn't exist.
    // However, for service-level logic, knowing the user wasn't found is important. The controller can mask this.
    // For now, we'll throw NotFoundError, but this is a design consideration.
    throw new NotFoundError('User with this email not found.'); 
  }

  // Generate a plain token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing it in the database
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Set expiration (e.g., 1 hour from now)
  user.passwordResetExpires = new Date(Date.now() + (config.jwt.passwordResetExpirationMinutes || 60) * 60 * 1000); 

  try {
    await user.save({ fields: ['passwordResetToken', 'passwordResetExpires'] });
    logger.info(`Password reset token generated for user: ${email}`);
    // In a real application, you would now send an email to the user with 'resetToken'
    // e.g., sendPasswordResetEmail(user.email, resetToken);
    return resetToken; // Return the plain token to be used in the reset link
  } catch (error) {
    logger.error(`Error saving password reset token for user ${email}: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while requesting password reset.');
  }
};

/**
 * Resets a user's password using a valid reset token.
 * @param {string} resetToken - The plain password reset token.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<void>}
 * @throws {ApiError} If the token is invalid, expired, or the user is not found.
 */
const resetPassword = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) {
    throw new BadRequestError('Reset token and new password are required.');
  }

  // Hash the incoming plain token to match the one stored in the database
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find user by the hashed token and check if it's not expired
  const user = await User.scope('withSensitiveInfo').findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [User.sequelize.Op.gt]: new Date() }, // Check if token is not expired
    },
  });

  if (!user) {
    logger.warn('Invalid or expired password reset token attempt.');
    throw new BadRequestError('Password reset token is invalid or has expired.');
  }

  // Set the new password (it will be hashed by the beforeUpdate hook in the User model)
  user.password = newPassword;
  // Clear the reset token fields
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  // Also clear any existing refresh token to force re-login on other devices
  user.refreshToken = null; 

  try {
    await user.save({ fields: ['password', 'passwordResetToken', 'passwordResetExpires', 'refreshToken'] });
    logger.info(`Password reset successfully for user: ${user.email}`);
    // In a real application, you might send a confirmation email here
    // e.g., sendPasswordResetSuccessEmail(user.email);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message).join(', ');
        logger.error(`Validation error during password reset for ${user.email}: ${messages}`);
        throw new BadRequestError(`Password reset failed: ${messages}`);
    }
    logger.error(`Error resetting password for user ${user.email}: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while resetting password.');
  }
};


/**
 * Generates an email verification token for a user and stores its hash.
 * (In a real app, this would also trigger sending an email with the plain token).
 * @param {string} userId - The ID of the user requesting email verification.
 * @returns {Promise<string>} The plain email verification token (for email sending).
 * @throws {ApiError} If the user is not found, already verified, or an error occurs.
 */
const requestEmailVerification = async (userId) => {
  if (!userId) {
    throw new BadRequestError('User ID is required to request email verification.');
  }

  const user = await User.scope('withSensitiveInfo').findByPk(userId);

  if (!user) {
    logger.warn(`Email verification request for non-existent user ID: ${userId}`);
    throw new NotFoundError('User not found.');
  }

  if (user.isEmailVerified) {
    logger.info(`Email verification requested for already verified user: ${user.email}`);
    throw new BadRequestError('Email is already verified.');
  }

  // Generate a plain token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing it in the database
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  // Set expiration (e.g., 24 hours from now)
  user.emailVerificationTokenExpires = new Date(Date.now() + (config.jwt.emailVerificationExpirationMinutes || 24 * 60) * 60 * 1000); 

  try {
    await user.save({ fields: ['emailVerificationToken', 'emailVerificationTokenExpires'] });
    logger.info(`Email verification token generated for user: ${user.email}`);
    // In a real application, you would now send an email to the user with 'verificationToken'
    // e.g., sendEmailVerificationLink(user.email, verificationToken);
    return verificationToken; // Return the plain token to be used in the verification link
  } catch (error) {
    logger.error(`Error saving email verification token for user ${user.email}: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while requesting email verification.');
  }
};

/**
 * Verifies a user's email address using a valid verification token.
 * @param {string} verificationToken - The plain email verification token.
 * @returns {Promise<void>}
 * @throws {ApiError} If the token is invalid, expired, or the user is not found.
 */
const verifyEmail = async (verificationToken) => {
  if (!verificationToken) {
    throw new BadRequestError('Email verification token is required.');
  }

  // Hash the incoming plain token to match the one stored in the database
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Find user by the hashed token and check if it's not expired
  const user = await User.scope('withSensitiveInfo').findOne({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: { [User.sequelize.Op.gt]: new Date() }, // Check if token is not expired
    },
  });

  if (!user) {
    logger.warn('Invalid or expired email verification token attempt.');
    throw new BadRequestError('Email verification token is invalid or has expired.');
  }

  if (user.isEmailVerified) {
    logger.info(`Email already verified for user: ${user.email}. Token was (re)used.`);
    // Optionally, still clear the token to prevent reuse, even if already verified.
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    try {
      await user.save({ fields: ['emailVerificationToken', 'emailVerificationTokenExpires']});
    } catch (saveError) {
        // Log error but don't fail the overall already-verified status.
        logger.error(`Error clearing already-used verification token for ${user.email}: ${saveError.message}`);
    }
    return; // Or throw BadRequestError('Email is already verified.') if strict about token reuse.
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpires = null;

  try {
    await user.save({ fields: ['isEmailVerified', 'emailVerificationToken', 'emailVerificationTokenExpires'] });
    logger.info(`Email verified successfully for user: ${user.email}`);
    // In a real application, you might send a welcome email or confirmation here
  } catch (error) {
    logger.error(`Error verifying email for user ${user.email}: ${error.message}`, { stack: error.stack });
    throw new ApiError(httpStatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while verifying email.');
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuthTokens,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
};
