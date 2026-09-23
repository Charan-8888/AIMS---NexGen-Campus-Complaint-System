const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const env = require('../config/environment');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Token Helpers ─────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const signRefreshToken = (id) =>
  jwt.sign({ id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

const createTokens = (user) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  return { token, refreshToken };
};

// ─── Register ──────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, studentId, employeeId } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    // Create user (passwordHash pre-save hook will bcrypt it)
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password, // pre-save hook hashes this
      department,
      studentId,
      employeeId,
      role: 'USER', // Default role for self-registration
    });

    const { token, refreshToken } = createTokens(user);

    logger.info(`[Auth] New user registered: ${email} (${user._id})`);

    // Audit log
    await AuditLog.create({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      entityLabel: user.email,
      description: `New user ${user.name} registered`,
    });

    return sendSuccess(
      res,
      { user, token, refreshToken },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Select passwordHash explicitly (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact admin.', 403);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const { token, refreshToken } = createTokens(user);

    // Remove passwordHash from response
    user.passwordHash = undefined;

    logger.info(`[Auth] User logged in: ${email} (${user.role})`);

    return sendSuccess(res, { user, token, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ─── Get Current User ──────────────────────────────────────────────────────

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, { user }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ────────────────────────────────────────────────────────

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'department'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ───────────────────────────────────────────────────────

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return sendError(res, 'New password must be at least 8 characters', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    // The pre-save hook will hash the new password
    user.passwordHash = newPassword;
    await user.save();

    logger.info(`[Auth] Password changed: ${user.email}`);

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent user enumeration
    if (!user) {
      return sendSuccess(
        res,
        null,
        'If an account with that email exists, a reset link has been sent.'
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // In production: send email with reset link
    // For MVP: log the token to console
    logger.info(`[Auth] Password reset token for ${email}: ${resetToken}`);
    logger.info(`[Auth] Reset link: ${env.FRONTEND_URL}/reset-password/${resetToken}`);

    return sendSuccess(
      res,
      null,
      'If an account with that email exists, a reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // The pre-save hook hashes this
    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const { token: jwt_token, refreshToken } = createTokens(user);

    logger.info(`[Auth] Password reset successful: ${user.email}`);

    return sendSuccess(res, { token: jwt_token, refreshToken }, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rt } = req.body;

    if (!rt) {
      return sendError(res, 'Refresh token required', 400);
    }

    const decoded = jwt.verify(rt, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const { token, refreshToken: newRefreshToken } = createTokens(user);

    return sendSuccess(res, { token, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};
