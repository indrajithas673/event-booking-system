const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * @desc    Aggregated dashboard stats for the logged-in organizer:
 *          total events by status, registrations, revenue estimate,
 *          upcoming count, capacity utilization, month-over-month registrations.
 * @route   GET /api/organizer/dashboard
 * @access  Organizer / Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const organizerId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [eventStats] = await Event.aggregate([
      { $match: { organizer: new mongoose.Types.ObjectId(organizerId) } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          publishedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
          },
          draftEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
          },
          cancelledEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          completedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalCapacity: { $sum: '$capacity' },
          totalRegistered: { $sum: '$registeredCount' },
          totalRevenue: {
            $sum: { $multiply: ['$price', '$registeredCount'] },
          },
          upcomingEvents: {
            $sum: { $cond: [{ $gte: ['$date', now] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = eventStats || {
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      cancelledEvents: 0,
      completedEvents: 0,
      totalCapacity: 0,
      totalRegistered: 0,
      totalRevenue: 0,
      upcomingEvents: 0,
    };

    const capacityUtilization =
      stats.totalCapacity > 0
        ? Math.round((stats.totalRegistered / stats.totalCapacity) * 100 * 100) / 100
        : 0;

    const organizerEventIds = await Event.find({ organizer: organizerId }).distinct('_id');

    const [thisMonthRegs, lastMonthRegs] = await Promise.all([
      Registration.countDocuments({
        event: { $in: organizerEventIds },
        status: 'confirmed',
        registeredAt: { $gte: startOfMonth },
      }),
      Registration.countDocuments({
        event: { $in: organizerEventIds },
        status: 'confirmed',
        registeredAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        _id: undefined,
        capacityUtilization,
        thisMonthRegistrations: thisMonthRegs,
        lastMonthRegistrations: lastMonthRegs,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Revenue breakdown grouped by event (confirmedCount × price).
 *          Sorted by revenue descending.
 * @route   GET /api/organizer/revenue
 * @access  Organizer / Admin
 */
const getRevenueBreakdown = async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    const revenue = await Event.aggregate([
      { $match: { organizer: new mongoose.Types.ObjectId(organizerId) } },
      {
        $project: {
          title: 1,
          price: 1,
          registeredCount: 1,
          capacity: 1,
          status: 1,
          date: 1,
          revenue: { $multiply: ['$price', '$registeredCount'] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: revenue.length,
      data: revenue,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    10 most recent registrations across all organizer's events.
 *          Populated with user name/email and event title.
 * @route   GET /api/organizer/recent-registrations
 * @access  Organizer / Admin
 */
const getRecentRegistrations = async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    const eventIds = await Event.find({ organizer: organizerId }).distinct(
      '_id'
    );

    const registrations = await Registration.find({ event: { $in: eventIds } })
      .sort({ registeredAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('event', 'title')
      .populate('seat', 'seatNumber');

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Organizer's upcoming published events sorted by date.
 *          Includes registeredCount, capacity, availableSpots.
 * @route   GET /api/organizer/upcoming-events
 * @access  Organizer / Admin
 */
const getUpcomingEvents = async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    const events = await Event.find({
      organizer: organizerId,
      status: 'published',
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .select('title slug date location capacity registeredCount price currency category');

    const data = events.map((event) => {
      const eventObj = event.toObject({ virtuals: true });
      return {
        _id: eventObj._id,
        title: eventObj.title,
        slug: eventObj.slug,
        date: eventObj.date,
        location: eventObj.location,
        capacity: eventObj.capacity,
        registeredCount: eventObj.registeredCount,
        availableSpots: eventObj.availableSpots,
        price: eventObj.price,
        currency: eventObj.currency,
        category: eventObj.category,
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueBreakdown,
  getRecentRegistrations,
  getUpcomingEvents,
};
