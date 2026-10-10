import express from 'express';
import mongoose from 'mongoose';
import LostFound from '../models/LostFound.js';
import Notification from '../models/Notification.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const toLfJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const idStr = obj._id ? obj._id.toString() : obj.id;
  return {
    ...obj,
    id: idStr,
    name: obj.title || obj.name,
    title: obj.title || obj.name,
    reportedByUsername: obj.reporterUsername || obj.reportedByUsername,
    claimedByUsername: obj.claimedBy || obj.claimedByUsername,
  };
};

// GET /api/lostfound
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, category, status, search, limit } = req.query;
    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (status && status !== 'all') {
      if (status === 'unclaimed') {
        query.status = 'open';
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    const resultLimit = limit ? Math.min(Math.max(Number(limit) || 0, 0), 100) : 0;
    const items = await LostFound.find(query).sort({ createdAt: -1 }).limit(resultLimit);
    return res.json(items.map(toLfJson));
  } catch (err) {
    console.error('[LOSTFOUND] Error fetching items:', err);
    return res.status(500).json({ message: 'Error fetching lost & found items' });
  }
});

// GET /api/lostfound/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      item = await LostFound.findById(id);
    }
    if (!item) {
      item = await LostFound.findOne({ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null });
    }

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json(toLfJson(item));
  } catch (err) {
    console.error('[LOSTFOUND] Error fetching item:', err);
    return res.status(500).json({ message: 'Error fetching item' });
  }
});

// POST /api/lostfound
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      name,
      title,
      type = 'found',
      category,
      location,
      date,
      description,
      photo,
      contact,
    } = req.body;

    const itemTitle = (title || name || '').trim();
    if (!itemTitle || !category || !location || !contact) {
      return res.status(400).json({
        message: 'Title/name, category, location, and contact information are required.',
      });
    }

    const newItem = await LostFound.create({
      title: itemTitle,
      type: type === 'lost' ? 'lost' : 'found',
      category: category.trim(),
      location: location.trim(),
      date: date ? new Date(date) : new Date(),
      description: description ? description.trim() : '',
      photo: photo || '',
      contact: contact.trim(),
      reporterId: req.user._id,
      reporterUsername: req.user.username,
      status: 'open',
    });

    return res.status(201).json(toLfJson(newItem));
  } catch (err) {
    console.error('[LOSTFOUND] Error creating item:', err);
    return res.status(500).json({ message: 'Error creating lost & found listing' });
  }
});

// PATCH /api/lostfound/:id/claim
router.patch('/:id/claim', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.status = 'claimed';
    item.claimedBy = req.user.username;
    item.claimedAt = new Date();
    await item.save();

    // Notify reporter
    await Notification.create({
      recipient: item.reporterUsername,
      sender: req.user.username,
      title: 'Lost & Found Item Claimed! 🔍',
      message: `@${req.user.username} has claimed the item "${item.title}". Verify details in chat!`,
      type: 'system',
      link: '/lostfound',
      data: { itemId: item._id },
    });

    return res.json({
      message: 'Item claimed successfully!',
      item: toLfJson(item),
    });
  } catch (err) {
    console.error('[LOSTFOUND] Error claiming item:', err);
    return res.status(500).json({ message: 'Error claiming item' });
  }
});

// DELETE /api/lostfound/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporterUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }

    await LostFound.findByIdAndDelete(id);
    return res.json({ message: 'Item removed successfully', id });
  } catch (err) {
    console.error('[LOSTFOUND] Error deleting item:', err);
    return res.status(500).json({ message: 'Error deleting item' });
  }
});

// GET /api/lostfound/matches/:id - Smart Match Engine
router.get('/matches/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const target = await LostFound.findById(id);
    if (!target) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Look for opposing items (if lost, search found; if found, search lost)
    const opposingType = target.type === 'lost' ? 'found' : 'lost';
    const candidates = await LostFound.find({
      type: opposingType,
      status: 'open',
    });

    const targetWords = `${target.title} ${target.description}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const targetWordsSet = new Set(targetWords);

    const matches = candidates
      .map((c) => {
        let score = 0;
        let reasons = [];

        // Category match
        if (c.category.toLowerCase() === target.category.toLowerCase()) {
          score += 40;
          reasons.push('Same category');
        }

        // Location match
        const locTarget = target.location.toLowerCase();
        const locCand = c.location.toLowerCase();
        if (locTarget === locCand || locTarget.includes(locCand) || locCand.includes(locTarget)) {
          score += 30;
          reasons.push('Nearby / matching location');
        }

        // Keyword overlap
        const candWords = `${c.title} ${c.description}`
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2);

        let commonWords = 0;
        candWords.forEach((w) => {
          if (targetWordsSet.has(w)) commonWords++;
        });

        if (commonWords > 0) {
          const kwScore = Math.min(30, commonWords * 10);
          score += kwScore;
          reasons.push(`${commonWords} keyword match(es)`);
        }

        return {
          item: toLfJson(c),
          matchScore: score,
          reasons,
        };
      })
      .filter((m) => m.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      targetItem: toLfJson(target),
      matches,
    });
  } catch (err) {
    console.error('[LOSTFOUND] Error finding smart matches:', err);
    return res.status(500).json({ message: 'Error calculating matches' });
  }
});

export default router;
