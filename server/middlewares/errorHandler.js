const env = require('../config/env');

const isProduction = env.NODE_ENV === 'production';

/**
 * Global error handler middleware.
 * Handles Mongoose, JWT, Multer, and operational errors with clean responses.
 */
const errorHandler = (err, req, res, next) => {
  if (!isProduction) {
    console.error('Error:', err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  // Mongoose validation error — collect field-specific messages
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join(', ');
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // JWT invalid token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal server error' : message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
