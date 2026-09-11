import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['product', 'rental'],
      default: 'product',
    },
    // Cache item details for fast display if desired
    title: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    photo: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
