const mongoose = require('mongoose');
const uuid = require('uuid');

const STATUSES = ['confirmed', 'cancelled', 'attended'];
const TICKET_TYPES = ['standard', 'vip'];

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat',
      required: [true, 'Seat is required'],
    },
    confirmationCode: {
      type: String,
      unique: true,
      default: () => uuid.v4().replace(/-/g, '').substring(0, 12).toUpperCase(),
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'confirmed',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    ticketType: {
      type: String,
      enum: {
        values: TICKET_TYPES,
        message: '{VALUE} is not a valid ticket type',
      },
      default: 'standard',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (confirmationCode already indexed via field-level unique: true)
registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ user: 1, status: 1 });

// Returns count of confirmed registrations for the given event
registrationSchema.statics.getConfirmedCount = async function (eventId) {
  return this.countDocuments({ event: eventId, status: 'confirmed' });
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
