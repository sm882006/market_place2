import mongoose from 'mongoose';

const lostFoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    contact: {
      type: String,
      required: [true, 'Contact information is required'],
    },
    reporterId: {
      type: String,
      required: true,
      index: true,
    },
    reporterUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'claimed', 'resolved'],
      default: 'open',
      index: true,
    },
    claimedBy: {
      type: String,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });

export default mongoose.models.LostFound || mongoose.model('LostFound', lostFoundSchema);
