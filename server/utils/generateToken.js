const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * @param {string} userId - MongoDB user ID
 * @returns {string} Signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

module.exports = generateToken;
