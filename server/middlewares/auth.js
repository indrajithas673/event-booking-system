const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Protect routes — only authenticated users with valid tokens.
 * Extracts token from Authorization header, verifies it,
 * checks user existence/status and passwordChangedAt for token invalidation.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user || !user.isActive) {
      throw new AppError('Not authorized', 401);
    }

    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (decoded.iat < changedTimestamp) {
        throw new AppError(
          'Password recently changed, please login again',
          401
        );
      }
    }

    user.passwordChangedAt = undefined;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication — sets req.user if a valid token is present,
 * otherwise sets req.user = null and continues without error.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (decoded.iat < changedTimestamp) {
        req.user = null;
        return next();
      }
    }

    user.passwordChangedAt = undefined;
    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization — restricts access to specified roles.
 * Must be used after protect middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'organizer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

/** Shorthand: only organizers and admins */
const organizerOnly = authorize('organizer', 'admin');

/** Shorthand: only admins */
const adminOnly = authorize('admin');

module.exports = { protect, optionalAuth, authorize, organizerOnly, adminOnly };
