import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const toProductJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
};

// GET /api/products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      status,
      sellerId,
      sellerUsername,
      sortBy,
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    // Filter blocked users if logged in
    if (req.user && req.user.blockedUsers && req.user.blockedUsers.length > 0) {
      query.sellerUsername = { $nin: req.user.blockedUsers };
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

    if (sellerId) {
      query.sellerId = sellerId;
    }

    if (sellerUsername) {
      query.sellerUsername = sellerUsername;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
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
    if (sortBy === 'price_asc') sortOption = { price: 1 };
    else if (sortBy === 'price_desc') sortOption = { price: -1 };
    else if (sortBy === 'date_asc') sortOption = { createdAt: 1 };
    else if (sortBy === 'date_desc') sortOption = { createdAt: -1 };
    else if (sortBy === 'views_desc') sortOption = { views: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json(products.map(toProductJson));
  } catch (err) {
    console.error('[PRODUCTS] Error fetching products:', err);
    return res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
      });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();

    // Fetch seller information for trust badge
    let seller = null;
    if (product.sellerUsername) {
      seller = await User.findOne({ username: product.sellerUsername }).select(
        'username isVerified ratingsAverage ratingsCount department avatar'
      );
    }

    // Fetch similar products
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'available',
    })
      .limit(4)
      .select('name price photo condition category');

    return res.json({
      product: toProductJson(product),
      seller: seller || {
        username: product.sellerUsername,
        isVerified: false,
        ratingsAverage: 5.0,
        ratingsCount: 0,
      },
      similarProducts: similarProducts.map(toProductJson),
    });
  } catch (err) {
    console.error('[PRODUCTS] Error fetching product detail:', err);
    return res.status(500).json({ message: 'Error fetching product' });
  }
});

// POST /api/products
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      condition,
      handleTime,
      contact,
      location,
      photo,
      photos,
      description,
    } = req.body;

    if (!name || price === undefined || !category || !contact) {
      return res.status(400).json({ message: 'Name, price, category, and contact are required.' });
    }

    const photoList = photos && photos.length > 0 ? photos : photo ? [photo] : [];

    const newProduct = await Product.create({
      name: name.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      category: category.trim(),
      condition: condition || 'Good',
      handleTime: handleTime || 'Immediate handover',
      contact: contact.trim(),
      location: location || 'PICT Campus',
      photo: photoList[0] || '',
      photos: photoList,
      description: description ? description.trim() : '',
      sellerId: req.user._id,
      sellerUsername: req.user.username,
      status: 'available',
    });

    return res.status(201).json(toProductJson(newProduct));
  } catch (err) {
    console.error('[PRODUCTS] Error creating product:', err);
    return res.status(500).json({ message: 'Error listing product' });
  }
});

// PUT /api/products/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to edit this listing' });
    }

    const fields = [
      'name',
      'price',
      'originalPrice',
      'category',
      'condition',
      'handleTime',
      'contact',
      'location',
      'photo',
      'photos',
      'description',
      'status',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    await product.save();
    return res.json(toProductJson(product));
  } catch (err) {
    console.error('[PRODUCTS] Error updating product:', err);
    return res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }

    await Product.findByIdAndDelete(id);
    return res.json({ message: 'Product deleted successfully', id });
  } catch (err) {
    console.error('[PRODUCTS] Error deleting product:', err);
    return res.status(500).json({ message: 'Error deleting product' });
  }
});

// POST /api/products/:id/buy-request
router.post('/:id/buy-request', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerContact, meetingLocation } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerUsername === req.user.username) {
      return res.status(400).json({ message: 'You cannot request to buy your own product.' });
    }

    if (product.status !== 'available') {
      return res.status(400).json({ message: `Product is already ${product.status}.` });
    }

    const requestId = 'REQ-BUY-' + Math.floor(1000 + Math.random() * 9000);

    product.status = 'pending';
    product.pendingBuyerId = req.user._id;
    product.pendingBuyerUsername = req.user.username;
    product.requestId = requestId;
    await product.save();

    // Create tracking Order
    const newOrder = await Order.create({
      orderType: 'buy',
      itemId: product._id.toString(),
      itemModel: 'Product',
      title: product.name,
      photo: product.photo || '',
      price: product.price,
      totalAmount: product.price,
      sellerId: product.sellerId,
      sellerUsername: product.sellerUsername,
      buyerId: req.user._id,
      buyerUsername: req.user.username,
      meetingLocation: meetingLocation || product.location || 'PICT Campus Quad',
      status: 'pending',
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: `Buy request initiated by @${req.user.username}`,
        },
      ],
    });

    // Notify seller
    await Notification.create({
      recipient: product.sellerUsername,
      sender: req.user.username,
      title: 'New Buy Request',
      message: `@${req.user.username} wants to buy your "${product.name}" for ₹${product.price}. Please review and approve.`,
      type: 'buy_request',
      link: '/profile?tab=sales',
      data: { productId: product._id, orderId: newOrder._id, requestId },
    });

    // Find or create chat conversation
    let chat = await Chat.findOne({
      participants: { $all: [req.user.username, product.sellerUsername] },
      productId: product._id.toString(),
    });

    const initMsg = {
      sender: req.user.username,
      text: `Hi! I just requested to buy "${product.name}" for ₹${product.price}. (Contact: ${buyerContact || 'via chat'})`,
      timestamp: new Date(),
      read: false,
    };

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.username, product.sellerUsername],
        productId: product._id.toString(),
        productTitle: product.name,
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
      message: 'Buy request sent successfully!',
      product: toProductJson(product),
      order: newOrder,
      chatId: chat._id,
    });
  } catch (err) {
    console.error('[PRODUCTS] Error sending buy request:', err);
    return res.status(500).json({ message: 'Error creating buy request' });
  }
});

// POST /api/products/:id/approve-sale
router.post('/:id/approve-sale', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to approve this sale' });
    }

    if (product.status !== 'pending' || !product.pendingBuyerUsername) {
      return res.status(400).json({ message: 'No pending buy request to approve.' });
    }

    const buyerUsername = product.pendingBuyerUsername;
    const buyerId = product.pendingBuyerId;

    product.status = 'sold';
    product.buyerId = buyerId;
    product.buyerUsername = buyerUsername;
    product.soldAt = new Date();
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    await product.save();

    // Update related Order
    const order = await Order.findOne({
      itemId: product._id.toString(),
      buyerUsername,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (order) {
      order.status = 'completed';
      order.statusTimeline.push({
        status: 'completed',
        timestamp: new Date(),
        note: `Sale approved by seller @${req.user.username}. Handover complete!`,
      });
      await order.save();
    }

    // Notify buyer
    await Notification.create({
      recipient: buyerUsername,
      sender: req.user.username,
      title: 'Buy Request Approved! 🎉',
      message: `Congratulations! @${req.user.username} approved your purchase of "${product.name}". Coordinate handover in chat.`,
      type: 'order_status',
      link: '/orders',
      data: { productId: product._id, orderId: order ? order._id : null },
    });

    return res.json({
      message: `Sale approved! "${product.name}" is now marked as sold.`,
      product: toProductJson(product),
      order,
    });
  } catch (err) {
    console.error('[PRODUCTS] Error approving sale:', err);
    return res.status(500).json({ message: 'Error approving sale' });
  }
});

// POST /api/products/:id/reject-sale
router.post('/:id/reject-sale', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerUsername !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to reject this sale' });
    }

    if (product.status !== 'pending' || !product.pendingBuyerUsername) {
      return res.status(400).json({ message: 'No pending buy request to reject.' });
    }

    const rejectedBuyer = product.pendingBuyerUsername;

    product.status = 'available';
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    product.requestId = null;
    await product.save();

    // Update Order
    const order = await Order.findOne({
      itemId: product._id.toString(),
      buyerUsername: rejectedBuyer,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (order) {
      order.status = 'cancelled';
      order.statusTimeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Buy request rejected by seller.`,
      });
      await order.save();
    }

    if (rejectedBuyer) {
      await Notification.create({
        recipient: rejectedBuyer,
        sender: req.user.username,
        title: 'Buy Request Declined',
        message: `@${req.user.username} was unable to accept your buy request for "${product.name}".`,
        type: 'order_status',
        link: '/marketplace',
      });
    }

    return res.json({
      message: 'Buy request rejected. Item is back to available status.',
      product: toProductJson(product),
    });
  } catch (err) {
    console.error('[PRODUCTS] Error rejecting sale:', err);
    return res.status(500).json({ message: 'Error rejecting sale' });
  }
});

export default router;
