const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');

const PUBLIC_FIELDS = ['name', 'avatar', 'bio', 'role', 'createdAt'];

// @desc    Get public profile of a user
// @route   GET /api/users/:id/profile
const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findById(id).select(PUBLIC_FIELDS.join(' '));

    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    const profile = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    };

    if (user.role === 'organizer') {
      const [eventCount, recentEvents] = await Promise.all([
        Event.countDocuments({ organizer: user._id, status: 'published' }),
        Event.find({ organizer: user._id, status: 'published' })
          .sort({ date: -1 })
          .limit(5)
          .select('title slug date location.city category image'),
      ]);

      profile.events = {
        count: eventCount,
        recent: recentEvents,
      };
    }

    res.status(200).json({
      success: true,
      data: { user: profile },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get organizer profile with all published events
// @route   GET /api/users/:id/organizer
const getOrganizerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findById(id).select(PUBLIC_FIELDS.join(' '));

    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'organizer') {
      throw new AppError('User is not an organizer', 400);
    }

    const events = await Event.find({
      organizer: user._id,
      status: 'published',
    })
      .sort({ date: -1 })
      .select('title slug description date endDate time location capacity registeredCount price currency category image');

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const confirmedCount = await Registration.getConfirmedCount(event._id);
        return {
          ...event.toObject(),
          registrationCount: confirmedCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        organizer: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        events: eventsWithCounts,
        totalEvents: eventsWithCounts.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's stats (protected)
// @route   GET /api/users/me/stats
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const confirmedRegsPromise = Registration.find({
      user: userId,
      status: 'confirmed',
    }).select('event');

    const [totalRegistrations, confirmedRegs, attendedCount, cancelledCount] =
      await Promise.all([
        Registration.countDocuments({ user: userId }),
        confirmedRegsPromise,
        Registration.countDocuments({ user: userId, status: 'attended' }),
        Registration.countDocuments({ user: userId, status: 'cancelled' }),
      ]);

    const upcomingEventIds = confirmedRegs.map((r) => r.event);
    const upcomingEvents = await Event.countDocuments({
      _id: { $in: upcomingEventIds },
      date: { $gt: now },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRegistrations,
          upcomingEvents,
          attendedCount,
          cancelledCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicProfile,
  getOrganizerProfile,
  getUserStats,
};
