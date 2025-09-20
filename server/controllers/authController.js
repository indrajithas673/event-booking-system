const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');

const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const ALLOWED_ROLES = ['attendee', 'organizer'];

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const sanitizedRole = ALLOWED_ROLES.includes(role) ? role : 'attendee';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: sanitizedRole,
    });

    user.password = undefined;

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email }).select(
      '+password +loginAttempts +lockUntil'
    );

    // Account lockout check
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new AppError(
        `Account temporarily locked. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
        423
      );
    }

    const isPasswordValid = user
      ? await user.comparePassword(password)
      : false;

    // Invalid credentials — increment attempts or lock
    if (!user || !isPasswordValid) {
      if (user) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
          user.loginAttempts = 0;
        }

        await user.save({ validateBeforeSave: false });
      }

      throw new AppError('Invalid email or password', 401);
    }

    // Successful login — reset counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateBeforeSave: false });

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    user.password = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

// @desc    Update user profile (whitelisted fields only)
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, avatar, preferences } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (preferences !== undefined) updateFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(
        'Please provide current password and new password',
        400
      );
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user account (with password confirmation)
// @route   DELETE /api/auth/delete-account
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw new AppError('Please provide your password to confirm', 400);
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Password is incorrect', 401);
    }

    // Cascade delete: remove user's registrations if model exists
    const Registration = mongoose.models.Registration;
    if (Registration) {
      await Registration.deleteMany({ user: req.user._id });
    }

    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
