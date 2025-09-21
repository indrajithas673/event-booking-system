const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');

// @desc    Get all seats for an event
// @route   GET /api/events/:eventId/seats
const getSeats = async (req, res, next) => {
  try {
    const seats = await Seat.find({ event: req.params.eventId }).sort('seatNumber');
    res.status(200).json({
      success: true,
      data: { seats },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Lock a seat temporarily
// @route   POST /api/events/:eventId/seats/:seatId/lock
const lockSeat = async (req, res, next) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user._id;

    const seat = await Seat.findById(seatId);

    if (!seat) {
      throw new AppError('Seat not found', 404);
    }

    if (seat.event.toString() !== eventId) {
      throw new AppError('Seat does not belong to this event', 400);
    }

    // Atomic update to lock the seat if it's available or the lock has expired
    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const updatedSeat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        $or: [
          { status: 'AVAILABLE' },
          { status: 'LOCKED', lockedUntil: { $lt: new Date() } },
        ],
      },
      {
        status: 'LOCKED',
        lockedBy: userId,
        lockedUntil: lockExpiry,
      },
      { new: true }
    );

    if (!updatedSeat) {
      throw new AppError('Seat is already locked or booked by someone else', 400);
    }

    // Emit socket event (to be hooked up later)
    if (req.app.get('io')) {
      req.app.get('io').to(`event-${eventId}`).emit('seatUpdated', updatedSeat);
    }

    res.status(200).json({
      success: true,
      data: { seat: updatedSeat },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlock a seat
// @route   POST /api/events/:eventId/seats/:seatId/unlock
const unlockSeat = async (req, res, next) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user._id;

    const seat = await Seat.findById(seatId);

    if (!seat) {
      throw new AppError('Seat not found', 404);
    }

    if (seat.event.toString() !== eventId) {
      throw new AppError('Seat does not belong to this event', 400);
    }

    const updatedSeat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        status: 'LOCKED',
        lockedBy: userId,
      },
      {
        status: 'AVAILABLE',
        lockedBy: null,
        lockedUntil: null,
      },
      { new: true }
    );

    if (!updatedSeat) {
      throw new AppError('Cannot unlock seat (not locked by you or already booked)', 400);
    }

    if (req.app.get('io')) {
      req.app.get('io').to(`event-${eventId}`).emit('seatUpdated', updatedSeat);
    }

    res.status(200).json({
      success: true,
      data: { seat: updatedSeat },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSeats,
  lockSeat,
  unlockSeat,
};
