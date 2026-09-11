import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    reviewerId: {
      type: String,
      required: true,
    },
    reviewerUsername: {
      type: String,
      required: true,
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
