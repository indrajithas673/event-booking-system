const { query } = require('express-validator');

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

const SORT_OPTIONS = [
  'date',
  '-date',
  'price',
  '-price',
  'title',
  'createdAt',
];

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
];

const eventFilterRules = [
  ...paginationRules,

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters')
    .escape(),

  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  query('city').optional().trim().escape(),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date'),

  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('priceMin must be a positive number'),

  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('priceMax must be a positive number'),

  query('sort')
    .optional()
    .isIn(SORT_OPTIONS)
    .withMessage(`Sort must be one of: ${SORT_OPTIONS.join(', ')}`),

  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Upcoming must be a boolean value'),
];

module.exports = { paginationRules, eventFilterRules };
