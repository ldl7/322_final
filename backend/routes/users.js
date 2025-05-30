const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { User } = require('../models');
const logger = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (err) {
    logger.error('Server error in users/', { error: err.message });
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    // Only allow users to access their own profile unless they're an admin
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to access this user' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    logger.error('Server error in users/:id', { error: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put(
  '/:id',
  [
    authenticateJWT,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Only allow users to update their own profile unless they're an admin
      if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to update this user' });
      }

      const { firstName, lastName, email } = req.body;

      let user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Update user
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;

      await user.save();

      // Don't send back the password
      user = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
      });

      res.json(user);
    } catch (err) {
      logger.error('Server error in users/:id PUT', { error: err.message });
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    // Only allow users to delete their own profile or admin to delete any profile
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this user' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Don't allow deletion of admin accounts by non-admin users
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete admin users' });
    }

    await user.destroy();

    res.json({ msg: 'User removed' });
  } catch (err) {
    logger.error('Server error in users/:id DELETE', { error: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Export the router with the routes attached
module.exports = router;
