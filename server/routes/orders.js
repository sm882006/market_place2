import express from 'express';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Rental from '../models/Rental.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const toOrderJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
};

// GET /api/orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role } = req.query; // 'buyer' or 'seller' or all
    const username = req.user.username;
    const userId = req.user._id;

    let query = {
      $or: [
        { buyerUsername: username },
        { buyerId: userId },
        { sellerUsername: username },
        { sellerId: userId },
      ],
    };

    if (role === 'buyer') {
      query = { $or: [{ buyerUsername: username }, { buyerId: userId }] };
    } else if (role === 'seller') {
      query = { $or: [{ sellerUsername: username }, { sellerId: userId }] };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.json(orders.map(toOrderJson));
  } catch (err) {
    console.error('[ORDERS] Error fetching orders:', err);
    return res.status(500).json({ message: 'Error fetching orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isParty =
      order.buyerUsername === req.user.username ||
      order.sellerUsername === req.user.username ||
      req.user.role === 'admin';

    if (!isParty) {
      return res.status(403).json({ message: 'Unauthorized to view this order' });
    }

    return res.json(toOrderJson(order));
  } catch (err) {
    console.error('[ORDERS] Error fetching order:', err);
    return res.status(500).json({ message: 'Error fetching order' });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'approved', 'completed', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isParty =
      order.buyerUsername === req.user.username ||
      order.sellerUsername === req.user.username ||
      req.user.role === 'admin';

    if (!isParty) {
      return res.status(403).json({ message: 'Unauthorized to modify this order' });
    }

    if (order.orderType === 'buy') {
      return res.status(400).json({ message: 'Sale requests must be accepted or declined from the request controls.' });
    }
    if (status !== 'returned' || order.status !== 'approved' ||
        (order.sellerUsername !== req.user.username && req.user.role !== 'admin')) {
      return res.status(400).json({ message: 'Only the rental owner can mark an approved rental as returned.' });
    }

    order.status = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Order marked as ${status} by @${req.user.username}`,
    });

    await order.save();

    // If rental returned, update rental availability
    if (order.orderType === 'rent' && status === 'returned') {
      const rental = await Rental.findById(order.itemId);
      if (rental) {
        rental.status = 'available';
        rental.renterId = null;
        rental.renterUsername = null;
        // mark corresponding range completed
        rental.bookedRanges.forEach((b) => {
          if (b.orderId === order._id.toString()) {
            b.status = 'completed';
          }
        });
        await rental.save();
      }
    }

    // Notify the other party
    const recipient =
      order.buyerUsername === req.user.username ? order.sellerUsername : order.buyerUsername;

    await Notification.create({
      recipient,
      sender: req.user.username,
      title: `Order Update: ${status.toUpperCase()}`,
      message: `@${req.user.username} marked order "${order.title}" as ${status}.`,
      type: 'order_status',
      link: '/orders',
      data: { orderId: order._id },
    });

    return res.json(toOrderJson(order));
  } catch (err) {
    console.error('[ORDERS] Error updating order status:', err);
    return res.status(500).json({ message: 'Error updating order' });
  }
});

export default router;
