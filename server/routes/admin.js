import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Rental from '../models/Rental.js';
import Order from '../models/Order.js';
import Report from '../models/Report.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, productCount, rentalCount, orderCount, pendingReportCount] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Rental.countDocuments(),
        Order.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
      ]);

    const completedOrders = await Order.find({ status: 'completed' });
    const totalVolume = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return res.json({
      users: userCount,
      products: productCount,
      rentals: rentalCount,
      orders: orderCount,
      pendingReports: pendingReportCount,
      totalVolume,
    });
  } catch (err) {
    console.error('[ADMIN] Error fetching stats:', err);
    return res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -verificationCode').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error('[ADMIN] Error fetching users:', err);
    return res.status(500).json({ message: 'Error fetching users' });
  }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    await user.save();
    return res.json({ message: `User verification updated to ${user.isVerified}`, user });
  } catch (err) {
    console.error('[ADMIN] Error updating user verification:', err);
    return res.status(500).json({ message: 'Error updating user verification' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    return res.json(reports);
  } catch (err) {
    console.error('[ADMIN] Error fetching reports:', err);
    return res.status(500).json({ message: 'Error fetching reports' });
  }
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    await report.save();

    return res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('[ADMIN] Error updating report:', err);
    return res.status(500).json({ message: 'Error updating report' });
  }
});

// DELETE /api/admin/items/:type/:id
router.delete('/items/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type === 'product') {
      await Product.findByIdAndDelete(id);
    } else if (type === 'rental') {
      await Rental.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ message: 'Invalid item type' });
    }
    return res.json({ message: `Item deleted successfully` });
  } catch (err) {
    console.error('[ADMIN] Error removing item:', err);
    return res.status(500).json({ message: 'Error deleting item' });
  }
});

export default router;
