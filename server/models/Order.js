import mongoose from 'mongoose';

const orderTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'completed', 'cancelled', 'returned'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ['buy', 'rent'],
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      index: true,
    },
    itemModel: {
      type: String,
      enum: ['Product', 'Rental'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    rentalDays: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    sellerId: {
      type: String,
      required: true,
      index: true,
    },
    sellerUsername: {
      type: String,
      required: true,
    },
    buyerId: {
      type: String,
      required: true,
      index: true,
    },
    buyerUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'cancelled', 'returned'],
      default: 'pending',
      index: true,
    },
    statusTimeline: [orderTimelineSchema],
    meetingLocation: {
      type: String,
      default: 'PICT Campus Quad / Main Gate',
    },
    meetingTime: {
      type: String,
      default: '',
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ sellerId: 1, buyerId: 1, status: 1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
