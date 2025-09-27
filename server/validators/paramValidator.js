const { param } = require('express-validator');

const mongoIdParam = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid resource ID'),
];

module.exports = { mongoIdParam };
