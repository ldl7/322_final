const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateEmail, validatePasswordReset, validateToken } = require('../middleware/authValidators'); // Assuming these validators will be created

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken); // Refresh token is in cookie, no specific validation here for body
router.post('/request-password-reset', validateEmail, authController.requestPasswordReset);
router.post('/reset-password/:token', validatePasswordReset, authController.resetPassword); // Token in URL, newPassword in body
router.get('/verify-email/:token', validateToken, authController.verifyEmail); // Token in URL

// Private routes (require authentication via JWT)
router.post('/logout', authenticateJWT, authController.logout);
router.post('/request-email-verification', authenticateJWT, authController.requestEmailVerification);

module.exports = router;
