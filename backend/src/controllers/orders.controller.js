import { getOrders } from '../repositories/orders.repository.js';

export const listOrders = (req, res) => {
  try {
    const userId = req.user.id;
    const orders = getOrders();

    const userOrders = orders.filter(
      o => o.buyerId === userId || o.sellerId === userId
    );

    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
};

