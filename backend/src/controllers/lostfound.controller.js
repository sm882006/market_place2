import { randomUUID } from 'node:crypto';
import { getLostFound, saveLostFound } from '../repositories/lostfound.repository.js';

export const listItems = (req, res) => {
  try {
    const items = getLostFound();
    const { status, location } = req.query;

    let result = [...items];
    if (status) {
      result = result.filter(item => item.status === status);
    }
    if (location && location !== 'All Locations') {
      result = result.filter(item => item.location.toLowerCase().includes(location.toLowerCase()));
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve lost & found items.' });
  }
};

export const reportItem = (req, res) => {
  try {
    const { name, location, date, category, description, contact, photo } = req.body;

    if (!name || !location || !contact) {
      return res.status(400).json({ message: 'Item name, place found, and contact number are required.' });
    }

    const items = getLostFound();
    const newItem = {
      id: 'lf_' + randomUUID(),
      name,
      location,
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'General',
      description: description || '',
      contact,
      photo: photo || '',
      status: 'unclaimed',
      reportedById: req.user.id,
      reportedByUsername: req.user.username,
      claimedById: null,
      claimedByUsername: null,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);
    saveLostFound(items);

    res.status(201).json({
      message: 'Item reported successfully!',
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report item.' });
  }
};

export const claimItem = (req, res) => {
  try {
    const { id } = req.params;
    const items = getLostFound();
    const itemIndex = items.findIndex(i => i.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const item = items[itemIndex];
    item.status = 'claimed';
    item.claimedById = req.user.id;
    item.claimedByUsername = req.user.username;
    items[itemIndex] = item;
    saveLostFound(items);

    res.json({
      message: 'Item marked as claimed!',
      item,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to claim item.' });
  }
};

export const deleteItem = (req, res) => {
  try {
    const { id } = req.params;
    let items = getLostFound();
    const item = items.find(i => i.id === id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.reportedById !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this report.' });
    }

    items = items.filter(i => i.id !== id);
    saveLostFound(items);

    res.json({ message: 'Lost & found report deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete report.' });
  }
};

