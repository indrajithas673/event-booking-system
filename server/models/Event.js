const mongoose = require('mongoose');
const slugify = require('slugify');

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

const CURRENCIES = ['USD', 'EUR', 'TRY', 'GBP'];

const STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      trim: true,
    },
    location: {
      venue: {
        type: String,
        required: [true, 'Venue is required'],
        trim: true,
        maxlength: [200, 'Venue cannot exceed 200 characters'],
      },
      address: {
        type: String,
        trim: true,
        maxlength: [300, 'Address cannot exceed 300 characters'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters'],
      },
    },
    rows: {
      type: Number,
      required: [true, 'Rows is required'],
      min: [1, 'Rows must be at least 1'],
    },
    seatsPerRow: {
      type: Number,
      required: [true, 'Seats per row is required'],
      min: [1, 'Seats per row must be at least 1'],
    },
    capacity: {
      type: Number,
      default: 0,
    },
    registeredCount: {
      type: Number,
      min: [0, 'Registered count cannot be negative'],
      default: 0,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    currency: {
      type: String,
      enum: {
        values: CURRENCIES,
        message: '{VALUE} is not a valid currency',
      },
      default: 'USD',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    maxRegistrationsPerUser: {
      type: Number,
      min: [1, 'Max registrations per user must be at least 1'],
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (slug already indexed via field-level unique: true)
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });

// Virtuals
eventSchema.virtual('availableSpots').get(function () {
  return this.capacity - this.registeredCount;
});

eventSchema.virtual('isFull').get(function () {
  return this.registeredCount >= this.capacity;
});

eventSchema.virtual('isPast').get(function () {
  return this.date < new Date();
});

// Normalize title for slug: dots → hyphens so "Next.js" becomes "next-js" instead of "nextjs"
const normalizeForSlug = (title) => slugify(title.replace(/\./g, '-'), { lower: true, strict: true });

// Generate unique slug from title on save (Mongoose 9 — no next)
eventSchema.pre('save', async function () {
  if (this.isModified('rows') || this.isModified('seatsPerRow')) {
    this.capacity = this.rows * this.seatsPerRow;
  }

  if (!this.isModified('title')) return;

  this.slug = normalizeForSlug(this.title);

  const existingSlug = await mongoose
    .model('Event')
    .findOne({ slug: this.slug, _id: { $ne: this._id } });

  if (existingSlug) {
    this.slug = `${this.slug}-${Date.now()}`;
  }
});

// Regenerate slug when title is updated via findOneAndUpdate
eventSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (!update.title) return;

  let slug = normalizeForSlug(update.title);

  const filter = this.getFilter();
  const existingSlug = await mongoose
    .model('Event')
    .findOne({ slug, _id: { $ne: filter._id } });

  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  this.set({ slug });
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
