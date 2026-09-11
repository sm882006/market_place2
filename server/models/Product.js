import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    handleTime: {
      type: String,
      default: 'Immediate handover',
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
    },
    location: {
      type: String,
      default: 'PICT Campus Quad',
    },
    photo: {
      type: String,
      default: '',
    },
    photos: [
      {
        type: String,
      },
    ],
    sellerId: {
      type: String,
      required: true,
      index: true,
    },
    sellerUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'sold'],
      default: 'available',
      index: true,
    },
    buyerId: {
      type: String,
      default: null,
    },
    buyerUsername: {
      type: String,
      default: null,
    },
    pendingBuyerId: {
      type: String,
      default: null,
    },
    pendingBuyerUsername: {
      type: String,
      default: null,
    },
    requestId: {
      type: String,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Search text index for powerful querying
productSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
