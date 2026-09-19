import express from 'express';
import Report from '../models/Report.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reports
router.post('/', verifyToken, async (req, res) => {
  try {
    const { targetType, targetId, targetTitle, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Target type, target ID, and reason are required' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reporterUsername: req.user.username,
      targetType,
      targetId,
      targetTitle: targetTitle || '',
      reason: reason.trim(),
      details: details ? details.trim() : '',
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Report submitted to campus moderators. Thank you for keeping the campus safe.',
      report,
    });
  } catch (err) {
    console.error('[REPORTS] Error creating report:', err);
    return res.status(500).json({ message: 'Error submitting report' });
  }
});

export default router;
