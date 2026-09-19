import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews
router.post('/', verifyToken, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ message: 'orderId and rating (1-5) are required' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyerUsername !== req.user.username && order.buyerId !== req.user._id) {
      return res.status(403).json({ message: 'Only the buyer can review this transaction.' });
    }

    if (order.status !== 'completed' && order.status !== 'approved') {
      return res.status(400).json({ message: 'Reviews can only be left for completed transactions.' });
    }

    const existing = await Review.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this order.' });
    }

    const review = await Review.create({
      orderId,
      reviewerId: req.user._id,
      reviewerUsername: req.user.username,
      sellerId: order.sellerId,
      sellerUsername: order.sellerUsername,
      rating: numRating,
      comment: comment ? comment.trim() : '',
    });

    order.isReviewed = true;
    await order.save();

    // Recalculate seller's ratings
    const allSellerReviews = await Review.find({ sellerUsername: order.sellerUsername });
    const count = allSellerReviews.length;
    const sum = allSellerReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));

    await User.findOneAndUpdate(
      { username: order.sellerUsername },
      { ratingsAverage: avg, ratingsCount: count }
    );

    // Notify seller
    await Notification.create({
      recipient: order.sellerUsername,
      sender: req.user.username,
      title: 'New Rating & Review! ⭐',
      message: `@${req.user.username} rated your transaction ${numRating} stars: "${comment || 'No comment'}"`,
      type: 'review',
      link: `/profile?tab=reviews`,
      data: { reviewId: review._id },
    });

    return res.status(201).json({
      message: 'Review submitted successfully!',
      review,
      sellerStats: { ratingsAverage: avg, ratingsCount: count },
    });
  } catch (err) {
    console.error('[REVIEWS] Error submitting review:', err);
    return res.status(500).json({ message: 'Error submitting review' });
  }
});

// GET /api/reviews/seller/:sellerUsername
router.get('/seller/:sellerUsername', async (req, res) => {
  try {
    const { sellerUsername } = req.params;
    const reviews = await Review.find({ sellerUsername }).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    console.error('[REVIEWS] Error fetching reviews:', err);
    return res.status(500).json({ message: 'Error fetching reviews' });
  }
});

export default router;
