import mongoose from 'mongoose';

const bookedRangeSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    renterId: { type: String, required: true },
    renterUsername: { type: String, required: true },
    orderId: { type: String, default: null },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  },
  { _id: false }
);

const rentalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    rentPerDay: {
      type: Number,
      required: [true, 'Rent per day is required'],
      min: [1, 'Rent per day must be at least ₹1'],
    },
    deposit: {
      type: Number,
      default: 0,
      min: [0, 'Deposit cannot be negative'],
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
    },
    location: {
      type: String,
      default: 'PICT Campus',
    },
    photo: {
      type: String,
      default: '',
    },
    photos: [{ type: String }],
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerUsername: {
      type: String,
      required: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableTill: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'rented'],
      default: 'available',
      index: true,
    },
    renterId: { type: String, default: null },
    renterUsername: { type: String, default: null },
    pendingRenterId: { type: String, default: null },
    pendingRenterUsername: { type: String, default: null },
    pendingDays: { type: Number, default: 1 },
    pendingStartDate: { type: Date, default: null },
    pendingEndDate: { type: Date, default: null },
    requestId: { type: String, default: null },
    rentedAt: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    bookedRanges: [bookedRangeSchema],
  },
  {
    timestamps: true,
  }
);

rentalSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.models.Rental || mongoose.model('Rental', rentalSchema);
