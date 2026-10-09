import { randomUUID } from 'node:crypto';
import { getRents, saveRents } from '../repositories/rents.repository.js';
import { getOrders, saveOrders } from '../repositories/orders.repository.js';
import { createNotification } from '../services/notification.service.js';
import { createRequestChat } from '../services/chat.service.js';

export const listRents = (req, res) => {
  try {
    const rents = getRents();
    const { status, category, ownerId } = req.query;

    let result = [...rents];
    if (status) {
      result = result.filter(r => r.status === status);
    }
    if (category && category !== 'All') {
      result = result.filter(r => r.category === category);
    }
    if (ownerId) {
      result = result.filter(r => r.ownerId === ownerId);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve rental items.' });
  }
};

export const createRent = (req, res) => {
  try {
    const { name, category, rentPerDay, deposit, availableFrom, availableTill, description, contact, photo, condition } = req.body;

    if (!name || !rentPerDay || !contact || !category) {
      return res.status(400).json({ message: 'Name, Rent per day, Contact number, and Category are required.' });
    }

    const rents = getRents();
    const newRent = {
      id: 'rent_' + randomUUID(),
      name,
      category,
      rentPerDay: parseFloat(rentPerDay),
      deposit: deposit ? parseFloat(deposit) : 0,
      availableFrom: availableFrom || new Date().toISOString().split('T')[0],
      availableTill: availableTill || '',
      condition: condition || 'Good',
      description: description || '',
      contact,
      photo: photo || '',
      ownerId: req.user.id,
      ownerUsername: req.user.username,
      status: 'available',
      renterId: null,
      renterUsername: null,
      createdAt: new Date().toISOString(),
      rentedAt: null,
      pendingRenterId: null,
      pendingRenterUsername: null,
    };

    rents.push(newRent);
    saveRents(rents);

    res.status(201).json({
      message: 'Rent item listed successfully!',
      rentItem: newRent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list rent item.' });
  }
};

export const rentItem = (req, res) => {
  try {
    const { id } = req.params;
    const { days = 1, contact = '' } = req.body;
    const renterId = req.user.id;
    const renterUsername = req.user.username;

    const rents = getRents();
    const rentIndex = rents.findIndex(r => r.id === id);
    if (rentIndex === -1) {
      return res.status(404).json({ message: 'Rent item not found.' });
    }

    const item = rents[rentIndex];
    if (item.ownerId === renterId) {
      return res.status(400).json({ message: 'You cannot rent your own item.' });
    }
    if (item.status === 'rented') {
      return res.status(400).json({ message: 'This item is currently rented out.' });
    }

    const rentDays = parseInt(days, 10) || 1;
    const totalAmount = (item.rentPerDay * rentDays) + (item.deposit || 0);

    item.status = 'rented';
    item.renterId = renterId;
    item.renterUsername = renterUsername;
    item.rentedAt = new Date().toISOString();
    item.pendingRenterId = null;
    item.pendingRenterUsername = null;
    rents[rentIndex] = item;
    saveRents(rents);

    // Save order
    const orders = getOrders();
    const newOrder = {
      id: 'ord_' + randomUUID(),
      type: 'rent',
      itemId: item.id,
      itemName: item.name,
      itemPhoto: item.photo,
      category: item.category,
      price: item.rentPerDay,
      deposit: item.deposit,
      rentDays,
      totalAmount,
      buyerId: renterId,
      buyerUsername: renterUsername,
      buyerContact: contact,
      sellerId: item.ownerId,
      sellerUsername: item.ownerUsername || 'Owner',
      sellerContact: item.contact,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveOrders(orders);

    createNotification({
      userId: item.ownerId,
      fromUserId: renterId,
      fromUsername: renterUsername,
      type: 'rent_confirmed',
      rentId: id,
      productName: item.name,
      message: `🎉 @${renterUsername} rented your "${item.name}" for ${rentDays} day(s)! Contact: ${contact || 'N/A'}.`,
    });

    res.json({
      message: 'Item rented successfully!',
      item,
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rent item.' });
  }
};

export const requestRental = (req, res) => {
  try {
    const { id } = req.params;
    const { days = 1, message: renterMsg } = req.body;
    const renterId = req.user.id;
    const renterUsername = req.user.username;

    const rents = getRents();
    const rentIndex = rents.findIndex(r => r.id === id);
    if (rentIndex === -1) {
      return res.status(404).json({ message: 'Rent item not found.' });
    }

    const item = rents[rentIndex];
    if (item.ownerId === renterId) {
      return res.status(400).json({ message: 'You cannot rent your own item.' });
    }
    if (item.status === 'rented') {
      return res.status(400).json({ message: 'This item is currently rented out.' });
    }
    if (item.status === 'pending') {
      return res.status(400).json({ message: 'Another student has already sent a request for this rental. Please check back later.' });
    }

    if (renterMsg != null && typeof renterMsg !== 'string') {
      return res.status(400).json({ message: 'Message must be text.' });
    }
    const requestId = 'REQ-RENT-' + Math.floor(1000 + Math.random() * 9000);
    const parsedDays = parseInt(days, 10) || 1;

    item.status = 'pending';
    item.pendingRenterId = renterId;
    item.pendingRenterUsername = renterUsername;
    item.pendingDays = parsedDays;
    item.requestId = requestId;
    rents[rentIndex] = item;
    saveRents(rents);

    const autoMsg = renterMsg || `Hi @${item.ownerUsername || 'Owner'}! I sent a rental request (#${requestId}) for "${item.name}" for ${parsedDays} day(s). When and where can we meet on campus?`;
    const chat = createRequestChat({ rentId: id, productId: null, productName: item.name, productPhoto: item.photo, buyerId: renterId, buyerUsername: renterUsername, sellerId: item.ownerId, sellerUsername: item.ownerUsername || 'Owner' }, autoMsg);

    // Notify owner privately with 3 options: Accept, Reject, Chat
    createNotification({
      userId: item.ownerId,
      fromUserId: renterId,
      fromUsername: renterUsername,
      type: 'rent_request',
      requestId,
      rentId: id,
      productName: item.name,
      price: item.rentPerDay,
      days: parsedDays,
      message: `@${renterUsername} requested to rent your "${item.name}" for ${parsedDays} day(s) (Request ID: #${requestId}). You can Accept, Reject, or Chat.`,
    });

    res.json({ message: `Rent request #${requestId} sent! The owner has received your notification.`, requestId, chatId: chat.id, item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send rent request.' });
  }
};

export const approveRent = (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const rents = getRents();
    const rentIndex = rents.findIndex(r => r.id === id);
    if (rentIndex === -1) {
      return res.status(404).json({ message: 'Rent item not found.' });
    }

    const item = rents[rentIndex];
    if (item.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Permission denied. Only the owner can approve this rent.' });
    }
    if (!item.pendingRenterId) {
      return res.status(400).json({ message: 'No pending rent request found.' });
    }

    const days = item.pendingDays || 1;
    const totalAmount = (item.rentPerDay * days) + (item.deposit || 0);

    const approvedRenterId = item.pendingRenterId;
    const approvedRenterUsername = item.pendingRenterUsername;
    const currentRequestId = item.requestId || ('REQ-RENT-' + Math.floor(1000 + Math.random() * 9000));

    item.status = 'rented';
    item.renterId = approvedRenterId;
    item.renterUsername = approvedRenterUsername;
    item.rentedAt = new Date().toISOString();
    item.pendingRenterId = null;
    item.pendingRenterUsername = null;
    item.pendingDays = null;
    rents[rentIndex] = item;
    saveRents(rents);

    const orders = getOrders();
    const newOrder = {
      id: 'ord_' + randomUUID(),
      type: 'rent',
      itemId: item.id,
      itemName: item.name,
      itemPhoto: item.photo,
      category: item.category,
      price: item.rentPerDay,
      deposit: item.deposit,
      rentDays: days,
      totalAmount,
      buyerId: approvedRenterId,
      buyerUsername: approvedRenterUsername,
      buyerContact: '',
      sellerId: item.ownerId,
      sellerUsername: item.ownerUsername,
      sellerContact: item.contact,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveOrders(orders);

    // Notify renter that request was accepted
    createNotification({
      userId: approvedRenterId,
      fromUserId: item.ownerId,
      fromUsername: item.ownerUsername,
      type: 'rent_approved',
      requestId: currentRequestId,
      rentId: id,
      productName: item.name,
      days,
      price: item.rentPerDay,
      message: `🎉 Great news! @${item.ownerUsername} ACCEPTED your rent request (#${currentRequestId}) for "${item.name}" for ${days} day(s)! Your rental is confirmed.`,
    });

    res.json({ message: 'Rent approved! The item is marked as Rented and the renter has been notified.', item, order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve rent.' });
  }
};

export const rejectRent = (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const rents = getRents();
    const rentIndex = rents.findIndex(r => r.id === id);
    if (rentIndex === -1) {
      return res.status(404).json({ message: 'Rent item not found.' });
    }

    const item = rents[rentIndex];
    if (item.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Permission denied.' });
    }

    const rejectedRenterId = item.pendingRenterId;
    const currentRequestId = item.requestId || ('REQ-RENT-' + Math.floor(1000 + Math.random() * 9000));

    item.status = 'available';
    item.pendingRenterId = null;
    item.pendingRenterUsername = null;
    item.pendingDays = null;
    item.requestId = null;
    rents[rentIndex] = item;
    saveRents(rents);

    if (rejectedRenterId) {
      createNotification({
        userId: rejectedRenterId,
        fromUserId: item.ownerId,
        fromUsername: item.ownerUsername,
        type: 'rent_rejected',
        requestId: currentRequestId,
        rentId: id,
        productName: item.name,
        message: `⚠️ Notice: @${item.ownerUsername} REJECTED your rent request (#${currentRequestId}) for "${item.name}". The item is available again for other users.`,
      });
    }

    res.json({ message: 'Rent request declined. Rental is back to available and the user has been notified.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline rent request.' });
  }
};

export const deleteRent = (req, res) => {
  try {
    const { id } = req.params;
    let rents = getRents();
    const item = rents.find(r => r.id === id);

    if (!item) {
      return res.status(404).json({ message: 'Rent item not found.' });
    }

    if (item.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this listing.' });
    }

    rents = rents.filter(r => r.id !== id);
    saveRents(rents);

    res.json({ message: 'Rent listing removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete rent listing.' });
  }
};

