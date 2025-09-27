const { body } = require('express-validator');

const CATEGORIES = [
  'conference',
  'workshop',
  'seminar',
  'meetup',
  'concert',
  'sports',
  'networking',
  'webinar',
  'other',
];

const CURRENCIES = ['USD', 'EUR', 'TRY', 'GBP'];

const createEventRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters')
    .escape(),

  body('date')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('time').optional().trim().escape(),

  body('location.venue')
    .notEmpty()
    .withMessage('Venue is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue cannot exceed 200 characters')
    .escape(),

  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address cannot exceed 300 characters')
    .escape(),

  body('location.city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters')
    .escape(),

  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters')
    .escape(),

  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Capacity must be between 1 and 100,000'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('currency')
    .optional()
    .isIn(CURRENCIES)
    .withMessage(`Currency must be one of: ${CURRENCIES.join(', ')}`),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*').optional().trim().escape(),

  body('maxRegistrationsPerUser')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max registrations per user must be between 1 and 10'),
];

const updateEventRules = createEventRules.map((rule) => rule.optional());

module.exports = {
  createEventRules,
  updateEventRules,
};
