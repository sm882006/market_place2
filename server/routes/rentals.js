import express from 'express';
import mongoose from 'mongoose';
import Rental from '../models/Rental.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const toRentalJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
};

// GET /api/rents
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      status,
      ownerUsername,
      sortBy,
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    if (req.user && req.user.blockedUsers && req.user.blockedUsers.length > 0) {
      query.ownerUsername = { $nin: req.user.blockedUsers };
    }

    if (status) {
      query.status = status;
    }

    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    if (ownerUsername) {
      query.ownerUsername = ownerUsername;
    }

    if (minPrice || maxPrice) {
      query.rentPerDay = {};
      if (minPrice) query.rentPerDay.$gte = Number(minPrice);
      if (maxPrice) query.rentPerDay.$lte = Number(maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOption = { rentPerDay: 1 };
    else if (sortBy === 'price_desc') sortOption = { rentPerDay: -1 };
    else if (sortBy === 'date_asc') sortOption = { createdAt: 1 };
    else if (sortBy === 'date_desc') sortOption = { createdAt: -1 };

    const rentals = await Rental.find(query)
      .sort(sortOption)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json(rentals.map(toRentalJson));
  } catch (err) {
    console.error('[RENTALS] Error fetching rentals:', err);
    return res.status(500).json({ message: 'Error fetching rentals' });
  }
});

// GET /api/rents/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let rental = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      rental = await Rental.findById(id);
    }
    if (!rental) {
      rental = await Rental.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
      });
    }

    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    let owner = null;
    if (rental.ownerUsername) {
      owner = await User.findOne({ username: rental.ownerUsername }).select(
        'username isVerified ratingsAverage ratingsCount department avatar'
      );
    }

    return res.json({
      rental: toRentalJson(rental),
      owner: owner || {
        username: rental.ownerUsername,
        isVerified: false,
        ratingsAverage: 5.0,
        ratingsCount: 0,
      },
    });
  } catch (err) {
    console.error('[RENTALS] Error fetching rental details:', err);
    return res.status(500).json({ message: 'Error fetching rental item' });
  }
});

// POST /api/rents
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      name,
      category,
      rentPerDay,
      deposit,
      availableFrom,
      availableTill,
      condition,
      contact,
      location,
      description,
      photo,
      photos,
    } = req.body;

    if (!name || rentPerDay === undefined || !category || !contact) {
      return res.status(400).json({ message: 'Name, rent per day, category, and contact are required.' });
    }

    const photoList = photos && photos.length > 0 ? photos : photo ? [photo] : [];

    const newRental = await Rental.create({
      name: name.trim(),
      category: category.trim(),
      rentPerDay: Number(rentPerDay),
      deposit: Number(deposit) || 0,
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      availableTill: availableTill ? new Date(availableTill) : null,
      condition: condition || 'Good',
      contact: contact.trim(),
      location: location || 'PICT Campus',
      description: description ? description.trim() : '',
      photo: photoList[0] || '',
      photos: photoList,
      ownerId: req.user._id,
      ownerUsername: req.user.username,
      status: 'available',
      bookedRanges: [],
    });

    return res.status(201).json(toRentalJson(newRental));
  } catch (err) {
    console.error('[RENTALS] Error creating rental listing:', err);
    return res.status(500).json({ message: 'Error creating rental listing' });
  }
});

// PUT /api/rents/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    if (rental.ownerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to edit this rental listing' });
    }

    const fields = [
      'name',
      'category',
      'rentPerDay',
      'deposit',
      'availableFrom',
      'availableTill',
      'condition',
      'contact',
      'location',
      'description',
      'photo',
      'photos',
      'status',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) rental[f] = req.body[f];
    });

    await rental.save();
    return res.json(toRentalJson(rental));
  } catch (err) {
    console.error('[RENTALS] Error updating rental listing:', err);
    return res.status(500).json({ message: 'Error updating rental listing' });
  }
});

// DELETE /api/rents/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    if (rental.ownerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this rental listing' });
    }

    await Rental.findByIdAndDelete(id);
    return res.json({ message: 'Rental deleted successfully', id });
  } catch (err) {
    console.error('[RENTALS] Error deleting rental item:', err);
    return res.status(500).json({ message: 'Error deleting rental item' });
  }
});

// POST /api/rents/:id/rent-request (with date range & overlap prevention!)
router.post('/:id/rent-request', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 1, startDate, endDate, renterContact, meetingLocation } = req.body;

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    if (rental.ownerUsername === req.user.username) {
      return res.status(400).json({ message: 'You cannot rent your own item.' });
    }

    const rentalDays = Math.max(1, Number(days) || 1);
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + rentalDays * 24 * 60 * 60 * 1000);

    // Verify overlap against active bookedRanges
    if (rental.bookedRanges && rental.bookedRanges.length > 0) {
      const overlap = rental.bookedRanges.find(
        (b) => b.status === 'active' && start < new Date(b.to) && end > new Date(b.from)
      );
      if (overlap) {
        const fromStr = new Date(overlap.from).toLocaleDateString('en-IN');
        const toStr = new Date(overlap.to).toLocaleDateString('en-IN');
        return res.status(409).json({
          message: `Booking conflict: Item is already booked from ${fromStr} to ${toStr}. Please select alternate dates.`,
        });
      }
    }

    const rentCost = rentalDays * rental.rentPerDay;
    const totalAmount = rentCost + (rental.deposit || 0);
    const requestId = 'REQ-RENT-' + Math.floor(1000 + Math.random() * 9000);

    rental.status = 'pending';
    rental.pendingRenterId = req.user._id;
    rental.pendingRenterUsername = req.user.username;
    rental.pendingDays = rentalDays;
    rental.pendingStartDate = start;
    rental.pendingEndDate = end;
    rental.requestId = requestId;
    await rental.save();

    // Create Order record
    const newOrder = await Order.create({
      orderType: 'rent',
      itemId: rental._id.toString(),
      itemModel: 'Rental',
      title: rental.name,
      photo: rental.photo || '',
      price: rentCost,
      deposit: rental.deposit || 0,
      totalAmount,
      rentalDays,
      startDate: start,
      endDate: end,
      sellerId: rental.ownerId,
      sellerUsername: rental.ownerUsername,
      buyerId: req.user._id,
      buyerUsername: req.user.username,
      meetingLocation: meetingLocation || rental.location || 'PICT Campus Quad',
      status: 'pending',
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: `Rental request for ${rentalDays} day(s) from @${req.user.username}`,
        },
      ],
    });

    // Notify owner
    await Notification.create({
      recipient: rental.ownerUsername,
      sender: req.user.username,
      title: 'New Rental Booking Request',
      message: `@${req.user.username} wants to rent "${rental.name}" for ${rentalDays} day(s) (₹${rentCost} + ₹${rental.deposit || 0} deposit = ₹${totalAmount}). Review and approve.`,
      type: 'rent_request',
      link: '/profile?tab=rentals',
      data: { rentalId: rental._id, orderId: newOrder._id, requestId },
    });

    // Find or create Chat
    let chat = await Chat.findOne({
      participants: { $all: [req.user.username, rental.ownerUsername] },
      productId: rental._id.toString(),
    });

    const initMsg = {
      sender: req.user.username,
      text: `Hi! I sent a rental request for "${rental.name}" for ${rentalDays} day(s) (Total: ₹${totalAmount} incl. deposit). (Contact: ${renterContact || 'via chat'})`,
      timestamp: new Date(),
      read: false,
    };

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.username, rental.ownerUsername],
        productId: rental._id.toString(),
        productTitle: rental.name,
        messages: [initMsg],
        lastMessage: initMsg.text,
        lastMessageAt: new Date(),
      });
    } else {
      chat.messages.push(initMsg);
      chat.lastMessage = initMsg.text;
      chat.lastMessageAt = new Date();
      await chat.save();
    }

    return res.json({
      message: `Rental request submitted for ${rentalDays} day(s)!`,
      rental: toRentalJson(rental),
      order: newOrder,
      chatId: chat._id,
    });
  } catch (err) {
    console.error('[RENTALS] Error submitting rental request:', err);
    return res.status(500).json({ message: 'Error submitting rental request' });
  }
});

// POST /api/rents/:id/approve-rent
router.post('/:id/approve-rent', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    if (rental.ownerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to approve this rental' });
    }

    if (rental.status !== 'pending' || !rental.pendingRenterUsername) {
      return res.status(400).json({ message: 'No pending rental request to approve.' });
    }

    const renterUsername = rental.pendingRenterUsername;
    const renterId = rental.pendingRenterId;
    const start = rental.pendingStartDate || new Date();
    const end =
      rental.pendingEndDate ||
      new Date(start.getTime() + (rental.pendingDays || 1) * 24 * 60 * 60 * 1000);

    // Find Order
    const order = await Order.findOne({
      itemId: rental._id.toString(),
      buyerUsername: renterUsername,
      status: 'pending',
    }).sort({ createdAt: -1 });

    // Register active booking range to prevent overlapping bookings
    rental.bookedRanges.push({
      from: start,
      to: end,
      renterId,
      renterUsername,
      orderId: order ? order._id.toString() : null,
      status: 'active',
    });

    rental.status = 'rented';
    rental.renterId = renterId;
    rental.renterUsername = renterUsername;
    rental.rentedAt = new Date();
    rental.returnDate = end;
    rental.pendingRenterId = null;
    rental.pendingRenterUsername = null;
    await rental.save();

    if (order) {
      order.status = 'approved';
      order.statusTimeline.push({
        status: 'approved',
        timestamp: new Date(),
        note: `Rental approved by owner @${req.user.username}. Item is rented until ${end.toLocaleDateString()}.`,
      });
      await order.save();
    }

    // Notify renter
    await Notification.create({
      recipient: renterUsername,
      sender: req.user.username,
      title: 'Rental Request Approved! 🎊',
      message: `@${req.user.username} approved your rental for "${rental.name}". Coordinate item pickup in chat!`,
      type: 'order_status',
      link: '/orders',
      data: { rentalId: rental._id, orderId: order ? order._id : null },
    });

    return res.json({
      message: `Rental approved! Item rented to @${renterUsername}.`,
      rental: toRentalJson(rental),
      order,
    });
  } catch (err) {
    console.error('[RENTALS] Error approving rent:', err);
    return res.status(500).json({ message: 'Error approving rental' });
  }
});

// POST /api/rents/:id/reject-rent
router.post('/:id/reject-rent', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    if (rental.ownerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to reject this rental' });
    }

    if (rental.status !== 'pending' || !rental.pendingRenterUsername) {
      return res.status(400).json({ message: 'No pending rental request to reject.' });
    }

    const rejectedRenter = rental.pendingRenterUsername;

    rental.status = 'available';
    rental.pendingRenterId = null;
    rental.pendingRenterUsername = null;
    rental.requestId = null;
    await rental.save();

    const order = await Order.findOne({
      itemId: rental._id.toString(),
      buyerUsername: rejectedRenter,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (order) {
      order.status = 'cancelled';
      order.statusTimeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Rental request declined by owner.',
      });
      await order.save();
    }

    if (rejectedRenter) {
      await Notification.create({
        recipient: rejectedRenter,
        sender: req.user.username,
        title: 'Rental Request Declined',
        message: `@${req.user.username} was unable to accept your rental request for "${rental.name}".`,
        type: 'order_status',
        link: '/rent',
      });
    }

    return res.json({
      message: 'Rental request rejected. Item is back to available.',
      rental: toRentalJson(rental),
    });
  } catch (err) {
    console.error('[RENTALS] Error rejecting rent:', err);
    return res.status(500).json({ message: 'Error rejecting rental' });
  }
});

export default router;
