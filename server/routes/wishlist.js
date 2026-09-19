import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Rental from '../models/Rental.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.user.username }).sort({ createdAt: -1 });
    return res.json(
      items.map((i) => ({
        id: i._id.toString(),
        itemId: i.itemId,
        itemType: i.itemType,
        title: i.title,
        price: i.price,
        photo: i.photo,
        category: i.category,
        createdAt: i.createdAt,
      }))
    );
  } catch (err) {
    console.error('[WISHLIST] Error fetching wishlist:', err);
    return res.status(500).json({ message: 'Error fetching wishlist' });
  }
});

// POST /api/wishlist/toggle
router.post('/toggle', verifyToken, async (req, res) => {
  try {
    const { itemId, itemType = 'product' } = req.body;
    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const existing = await Wishlist.findOne({
      userId: req.user.username,
      itemId: String(itemId),
    });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({ saved: false, message: 'Removed from wishlist', itemId });
    }

    // Lookup item details to cache
    let title = '';
    let price = 0;
    let photo = '';
    let category = '';

    if (itemType === 'rental') {
      const r = await Rental.findById(itemId).catch(() => null);
      if (r) {
        title = r.name;
        price = r.rentPerDay;
        photo = r.photo;
        category = r.category;
      }
    } else {
      const p = await Product.findById(itemId).catch(() => null);
      if (p) {
        title = p.name;
        price = p.price;
        photo = p.photo;
        category = p.category;
      }
    }

    const item = await Wishlist.create({
      userId: req.user.username,
      itemId: String(itemId),
      itemType,
      title,
      price,
      photo,
      category,
    });

    return res.json({
      saved: true,
      message: 'Saved to wishlist',
      item: {
        id: item._id.toString(),
        itemId: item.itemId,
        itemType: item.itemType,
        title: item.title,
        price: item.price,
        photo: item.photo,
        category: item.category,
      },
    });
  } catch (err) {
    console.error('[WISHLIST] Error toggling wishlist:', err);
    return res.status(500).json({ message: 'Error updating wishlist' });
  }
});

// DELETE /api/wishlist/:itemId
router.delete('/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    await Wishlist.findOneAndDelete({
      userId: req.user.username,
      itemId: String(itemId),
    });
    return res.json({ message: 'Item removed from wishlist', itemId });
  } catch (err) {
    console.error('[WISHLIST] Error deleting wishlist item:', err);
    return res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

export default router;
