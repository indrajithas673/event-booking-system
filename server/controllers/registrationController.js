const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');
const escapeRegex = require('../utils/escapeRegex');


// @desc    Register for an event (race-condition safe)
// @route   POST /api/events/:id/register
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;
    const { seatId, ticketType, notes } = req.body;

    if (!seatId) {
      throw new AppError('Seat ID is required', 400);
    }

    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== 'published') {
      throw new AppError('Event is not available for registration', 400);
    }

    if (event.date < new Date()) {
      throw new AppError('Event has already passed', 400);
    }

    const existingRegistration = await Registration.findOne({
      user: userId,
      event: eventId,
    });

    if (existingRegistration && existingRegistration.status === 'confirmed') {
      throw new AppError('You are already registered for this event', 400);
    }

    // Atomically find the seat, ensure it's locked by the user, and lock hasn't expired.
    // If valid, change to BOOKED.
    const updatedSeat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        event: eventId,
        status: 'LOCKED',
        lockedBy: userId,
        lockedUntil: { $gte: new Date() }, // lock has not expired
      },
      {
        status: 'BOOKED',
        lockedUntil: null, // clear the expiry
      },
      { new: true }
    );

    if (!updatedSeat) {
      throw new AppError('Cannot book seat. Make sure you have locked it and the lock has not expired.', 400);
    }

    try {
      // Also update event registeredCount for compatibility if needed
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

      let registration;
      if (existingRegistration && existingRegistration.status === 'cancelled') {
        existingRegistration.status = 'confirmed';
        existingRegistration.seat = seatId;
        existingRegistration.ticketType = ticketType || 'standard';
        existingRegistration.notes = notes || '';
        existingRegistration.registeredAt = new Date();
        registration = await existingRegistration.save();
      } else {
        registration = await Registration.create({
          user: userId,
          event: eventId,
          seat: seatId,
          ticketType: ticketType || 'standard',
          notes: notes || '',
        });
      }

      await registration.populate('event', 'title slug date time location image status organizer');
      await registration.populate('seat', 'seatNumber');

      if (req.app.get('io')) {
        req.app.get('io').to(`event-${eventId}`).emit('seatUpdated', updatedSeat);
      }

      res.status(201).json({
        success: true,
        data: {
          registration,
          confirmationCode: registration.confirmationCode,
        },
      });
    } catch (registrationError) {
      // Compensation: Revert the seat back to AVAILABLE
      const revertedSeat = await Seat.findByIdAndUpdate(
        seatId,
        {
          status: 'AVAILABLE',
          lockedBy: null,
          lockedUntil: null,
        },
        { new: true }
      );

      // Revert event count
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });

      if (revertedSeat && req.app.get('io')) {
        req.app.get('io').to(`event-${eventId}`).emit('seatUpdated', revertedSeat);
      }

      throw registrationError;
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a registration
// @route   DELETE /api/registrations/:id
const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to cancel this registration', 403);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('Registration is already cancelled', 400);
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    // Free the seat
    if (registration.seat) {
      const updatedSeat = await Seat.findByIdAndUpdate(
        registration.seat,
        {
          status: 'AVAILABLE',
          lockedBy: null,
          lockedUntil: null,
        },
        { new: true }
      );

      if (updatedSeat && req.app.get('io')) {
        req.app.get('io').to(`event-${registration.event}`).emit('seatUpdated', updatedSeat);
      }
    }

    // Atomic decrement with floor at 0
    await Event.findOneAndUpdate(
      { _id: registration.event, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's registrations
// @route   GET /api/registrations/my
const getMyRegistrations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status && ['confirmed', 'cancelled', 'attended'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('event', 'title slug date location image status organizer')
        .populate('seat', 'seatNumber'),
      Registration.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrations,
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

// @desc    Get a single registration by ID
// @route   GET /api/registrations/:id
const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event', 'title slug date time location image status organizer')
      .populate('user', 'name email avatar')
      .populate('seat', 'seatNumber');

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOwner =
      registration.user._id.toString() === req.user._id.toString();
    const isAdminOrOrganizer =
      req.user.role === 'admin' ||
      registration.event.organizer?.toString() === req.user._id.toString();

    if (!isOwner && !isAdminOrOrganizer) {
      throw new AppError('Not authorized to view this registration', 403);
    }

    res.status(200).json({
      success: true,
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Find registration by confirmation code
// @route   GET /api/registrations/code/:code
const getRegistrationByCode = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      confirmationCode: req.params.code.toUpperCase(),
    })
      .populate('event', 'title slug date time location image status organizer')
      .populate('user', 'name email avatar')
      .populate('seat', 'seatNumber');

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOwner =
      registration.user._id.toString() === req.user._id.toString();
    const isAdminOrOrganizer =
      req.user.role === 'admin' ||
      registration.event.organizer?.toString() === req.user._id.toString();

    if (!isOwner && !isAdminOrOrganizer) {
      throw new AppError('Not authorized to view this registration', 403);
    }

    res.status(200).json({
      success: true,
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registrations for a specific event (organizer/admin)
// @route   GET /api/events/:id/registrations
const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const isOrganizer =
      event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to view registrations for this event', 403);
    }

    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = { event: event._id };
    if (status && ['confirmed', 'cancelled', 'attended'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let registrationsQuery = Registration.find(filter)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone avatar')
      .populate('seat', 'seatNumber');

    const [registrations, total, confirmedCount, cancelledCount, attendedCount] =
      await Promise.all([
        registrationsQuery,
        Registration.countDocuments(filter),
        Registration.countDocuments({ event: event._id, status: 'confirmed' }),
        Registration.countDocuments({ event: event._id, status: 'cancelled' }),
        Registration.countDocuments({ event: event._id, status: 'attended' }),
      ]);

    let filteredRegistrations = registrations;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filteredRegistrations = registrations.filter(
        (reg) =>
          searchRegex.test(reg.user?.name) || searchRegex.test(reg.user?.email)
      );
    }

    const totalConfirmed = confirmedCount;
    const totalCancelled = cancelledCount;
    const capacityPercentage =
      event.capacity > 0
        ? Math.round(((confirmedCount + attendedCount) / event.capacity) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        registrations: filteredRegistrations,
        stats: {
          totalConfirmed,
          totalCancelled,
          totalAttended: attendedCount,
          capacityPercentage,
        },
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

// @desc    Check in an attendee (organizer/admin)
// @route   PUT /api/registrations/:id/check-in
const checkInAttendee = async (req, res, next) => {
  try {
    // Find by ID or confirmation code
    let registration = await Registration.findById(req.params.id).populate(
      'event',
      'organizer title'
    );

    if (!registration) {
      registration = await Registration.findOne({
        confirmationCode: req.params.id.toUpperCase(),
      }).populate('event', 'organizer title');
    }

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    const isOrganizer =
      registration.event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to check in attendees for this event', 403);
    }

    if (registration.status === 'attended') {
      throw new AppError('Attendee has already been checked in', 400);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('Cannot check in a cancelled registration', 400);
    }

    if (registration.status !== 'confirmed') {
      throw new AppError('Only confirmed registrations can be checked in', 400);
    }

    registration.status = 'attended';
    await registration.save();

    await registration.populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: { registration },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get event statistics (organizer/admin)
// @route   GET /api/events/:id/stats
const getEventStats = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const isOrganizer =
      event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      throw new AppError('Not authorized to view stats for this event', 403);
    }

    const [totalRegistrations, confirmedCount, cancelledCount, attendedCount] =
      await Promise.all([
        Registration.countDocuments({ event: event._id }),
        Registration.countDocuments({ event: event._id, status: 'confirmed' }),
        Registration.countDocuments({ event: event._id, status: 'cancelled' }),
        Registration.countDocuments({ event: event._id, status: 'attended' }),
      ]);

    const capacityPercentage =
      event.capacity > 0
        ? Math.round(((confirmedCount + attendedCount) / event.capacity) * 100)
        : 0;

    const revenueEstimate = event.price * confirmedCount;

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          capacity: event.capacity,
          price: event.price,
          currency: event.currency,
        },
        stats: {
          totalRegistrations,
          confirmedCount,
          cancelledCount,
          attendedCount,
          capacityPercentage,
          revenueEstimate,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationById,
  getRegistrationByCode,
  getEventRegistrations,
  checkInAttendee,
  getEventStats,
};
