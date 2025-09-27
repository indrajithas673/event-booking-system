const { body, param } = require('express-validator');

const registerForEventRules = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .escape(),

  body('ticketType')
    .optional()
    .isIn(['standard', 'vip'])
    .withMessage('Ticket type must be standard or vip'),
];

const confirmationCodeParam = [
  param('code')
    .trim()
    .isLength({ min: 12, max: 12 })
    .withMessage('Invalid confirmation code format')
    .isAlphanumeric()
    .withMessage('Confirmation code must be alphanumeric'),
];

module.exports = { registerForEventRules, confirmationCodeParam };
