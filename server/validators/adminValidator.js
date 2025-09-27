const { body } = require('express-validator');

const updateUserRoleRules = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['attendee', 'organizer', 'admin'])
    .withMessage('Role must be attendee, organizer, or admin'),
];

const updateEventStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'published', 'cancelled', 'completed'])
    .withMessage('Status must be draft, published, cancelled, or completed'),
];

module.exports = { updateUserRoleRules, updateEventStatusRules };
