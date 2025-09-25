const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  updateUserRoleRules,
  updateEventStatusRules,
} = require('../validators/adminValidator');
const { paginationRules } = require('../validators/queryValidator');
const { mongoIdParam } = require('../validators/paramValidator');
const {
  getAdminDashboard,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getAllEvents,
  adminUpdateEventStatus,
  adminDeleteEvent,
  getAllRegistrations,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// User management
router.get('/users', paginationRules, validate, getAllUsers);
router.put('/users/:id/role', mongoIdParam(), updateUserRoleRules, validate, updateUserRole);
router.put('/users/:id/toggle-active', mongoIdParam(), validate, toggleUserActive);
router.delete('/users/:id', mongoIdParam(), validate, deleteUser);

// Event management
router.get('/events', paginationRules, validate, getAllEvents);
router.put(
  '/events/:id/status',
  mongoIdParam(),
  updateEventStatusRules,
  validate,
  adminUpdateEventStatus
);
router.delete('/events/:id', mongoIdParam(), validate, adminDeleteEvent);

// Registration management
router.get('/registrations', paginationRules, validate, getAllRegistrations);

module.exports = router;
