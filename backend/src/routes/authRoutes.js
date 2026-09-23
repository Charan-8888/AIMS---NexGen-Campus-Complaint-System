const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword, refreshToken,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
