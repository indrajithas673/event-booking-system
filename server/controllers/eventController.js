const mongoose = require('mongoose');
const Event = require('../models/Event');
const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');
const escapeRegex = require('../utils/escapeRegex');

const ALLOWED_FIELDS = [
  'title',
  'description',
  'date',
  'endDate',
  'time',
  'location',
  'capacity',
  'price',
  'currency',
  'category',
  'tags',
  'image',
  'maxRegistrationsPerUser',
  'rows',
  'seatsPerRow',
];

/**
 * Pick only whitelisted keys from an object to prevent mass-assignment.
 */
const pickAllowedFields = (source, fields) => {
  const result = {};
  for (const key of fields) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
};

/**
 * Check whether the requesting user owns the event or is an admin.
 */
const isOwnerOrAdmin = (event, user) =>
  event.organizer.toString() === user._id.toString() || user.role === 'admin';

// @desc    Create a new event (draft)
// @route   POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const fields = pickAllowedFields(req.body, ALLOWED_FIELDS);

    if (new Date(fields.date) <= new Date()) {
      throw new AppError('Event date must be in the future', 400);
    }

    fields.organizer = req.user._id;
    fields.status = 'draft';

    let event;

    try {
      event = await Event.create(fields);

      if (fields.rows && fields.seatsPerRow) {
        const seatsToCreate = [];
        for (let r = 0; r < fields.rows; r++) {
          const rowLetter = String.fromCharCode(65 + r);
          for (let s = 1; s <= fields.seatsPerRow; s++) {
            seatsToCreate.push({
              event: event._id,
              seatNumber: `${rowLetter}${s}`,
              status: 'AVAILABLE',
            });
          }
        }
        await Seat.insertMany(seatsToCreate);
      }
    } catch (error) {
      if (event && event._id) {
         // Rollback event creation manually if seats fail
         await Event.findByIdAndDelete(event._id);
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      throw new AppError('Not authorized to update this event', 403);
    }

    if (event.status === 'cancelled') {
      throw new AppError('Cannot update a cancelled event', 400);
    }

    const fields = pickAllowedFields(req.body, ALLOWED_FIELDS);

    if (
      fields.capacity !== undefined &&
      fields.capacity < event.registeredCount
    ) {
      throw new AppError(
        'Capacity cannot be reduced below current registrations',
        400
      );
    }

    Object.assign(event, fields);
    await event.save();

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      throw new AppError('Not authorized to delete this event', 403);
    }

    if (event.registeredCount > 0) {
      throw new AppError(
        'Cannot delete event with active registrations. Cancel the event first.',
        400
      );
    }

    const Registration = mongoose.models.Registration;
    if (Registration) {
      await Registration.deleteMany({ event: event._id });
    }

    await Event.findByIdAndDelete(event._id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Publish a draft event
// @route   PUT /api/events/:id/publish
const publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      throw new AppError('Not authorized to publish this event', 403);
    }

    if (event.status !== 'draft') {
      throw new AppError('Only draft events can be published', 400);
    }

    const requiredFields = ['title', 'description', 'date', 'capacity', 'category'];
    const missingFields = requiredFields.filter((field) => !event[field]);

    if (!event.location?.venue || !event.location?.city) {
      missingFields.push('location (venue and city)');
    }

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      );
    }

    event.status = 'published';
    await event.save();

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a published or draft event
// @route   PUT /api/events/:id/cancel
const cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      throw new AppError('Not authorized to cancel this event', 403);
    }

    if (!['published', 'draft'].includes(event.status)) {
      throw new AppError('Only published or draft events can be cancelled', 400);
    }

    event.status = 'cancelled';
    await event.save();

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List published events with filtering, search, sorting, pagination
// @route   GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      city,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      sort = 'date',
      upcoming,
    } = req.query;

    const filter = { status: 'published' };

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    if (category) filter.category = category;
    if (city) filter['location.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      filter.price = {};
      if (priceMin !== undefined) filter.price.$gte = Number(priceMin);
      if (priceMax !== undefined) filter.price.$lte = Number(priceMax);
    }

    if (upcoming === 'true') {
      filter.date = { ...filter.date, $gte: new Date() };
    }

    const sortOptions = {
      date: { date: 1 },
      '-date': { date: -1 },
      price: { price: 1 },
      '-price': { price: -1 },
      title: { title: 1 },
      createdAt: { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || { date: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .populate('organizer', 'name avatar'),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        events,
        page: pageNum,
        totalPages,
        total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single published event by slug
// @route   GET /api/events/:slug
const getEventBySlug = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      slug: req.params.slug,
      status: 'published',
    }).populate('organizer', 'name avatar');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const response = { event };

    if (req.user) {
      const Registration = mongoose.models.Registration;
      if (Registration) {
        const existingRegistration = await Registration.findOne({
          event: event._id,
          user: req.user._id,
          status: { $ne: 'cancelled' },
        });
        response.isRegistered = !!existingRegistration;
        if (existingRegistration) {
          response.userRegistration = {
            _id: existingRegistration._id,
            status: existingRegistration.status,
            confirmationCode: existingRegistration.confirmationCode,
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single event by ID (owners/admins can see any status)
// @route   GET /api/events/id/:id
const getEventById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    const isOwnerOrAdminUser =
      req.user &&
      (req.user.role === 'admin' || req.user.role === 'organizer');

    if (!isOwnerOrAdminUser) {
      filter.status = 'published';
    }

    const event = await Event.findOne(filter).populate('organizer', 'name avatar');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (
      isOwnerOrAdminUser &&
      req.user.role === 'organizer' &&
      event.organizer?._id?.toString() !== req.user._id.toString()
    ) {
      if (event.status !== 'published') {
        throw new AppError('Event not found', 404);
      }
    }

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured upcoming published events
// @route   GET /api/events/featured
const getFeaturedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'published',
      isFeatured: true,
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(6)
      .populate('organizer', 'name avatar');

    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get aggregated category list with event counts
// @route   GET /api/events/categories
const getEventCategories = async (req, res, next) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events organized by the current user
// @route   GET /api/events/my/organized
const getMyEvents = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { organizer: req.user._id };
    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('organizer', 'name email'),
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  getMyEvents,
  getEvents,
  getEventBySlug,
  getEventById,
  getFeaturedEvents,
  getEventCategories,
};
