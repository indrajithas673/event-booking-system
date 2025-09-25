const express = require('express');
const { protect, organizerOnly } = require('../middlewares/auth');
const {
  getDashboardStats,
  getRevenueBreakdown,
  getRecentRegistrations,
  getUpcomingEvents,
} = require('../controllers/organizerController');

const router = express.Router();

// All organizer routes require authentication + organizer/admin role
router.use(protect, organizerOnly);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueBreakdown);
router.get('/recent-registrations', getRecentRegistrations);
router.get('/upcoming-events', getUpcomingEvents);

module.exports = router;
