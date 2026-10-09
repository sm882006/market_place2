import { randomUUID } from 'node:crypto';
import { getProducts, saveProducts } from '../repositories/products.repository.js';
import { getOrders, saveOrders } from '../repositories/orders.repository.js';
import { createNotification } from '../services/notification.service.js';
import { createRequestChat } from '../services/chat.service.js';

export const listProducts = (req, res) => {
  try {
    const products = getProducts();
    const { status, category, sellerId } = req.query;

    let result = [...products];
    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }
    if (sellerId) {
      result = result.filter(p => p.sellerId === sellerId);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  }
};

export const createProduct = (req, res) => {
  try {
    const { name, price, originalPrice, handleTime, contact, category, condition, description, photo } = req.body;

    if (!name || !price || !contact || !category) {
      return res.status(400).json({ message: 'Name, price, contact number, and category are required.' });
    }

    const products = getProducts();

    const newProduct = {
      id: 'prod_' + randomUUID(),
      name,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      condition: condition || 'Good',
      handleTime: handleTime || 'Immediate handover',
      contact,
      category,
      description: description || '',
      photo: photo || '',
      sellerId: req.user.id,
      sellerUsername: req.user.username,
      status: 'available',
      buyerId: null,
      buyerUsername: null,
      createdAt: new Date().toISOString(),
      soldAt: null,
      pendingBuyerId: null,
      pendingBuyerUsername: null,
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({
      message: 'Product listed successfully!',
      product: newProduct,
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Failed to add product.' });
  }
};

export const buyProduct = (req, res) => {
  try {
    const { id } = req.params;
    const { contact = '' } = req.body;
    const buyerId = req.user.id;
    const buyerUsername = req.user.username;

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[productIndex];

    if (product.sellerId === buyerId) {
      return res.status(400).json({ message: 'You cannot buy your own listed item.' });
    }

    if (product.status === 'sold') {
      return res.status(400).json({ message: 'This item has already been sold.' });
    }

    // Mark as sold
    product.status = 'sold';
    product.buyerId = buyerId;
    product.buyerUsername = buyerUsername;
    product.soldAt = new Date().toISOString();
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    products[productIndex] = product;
    saveProducts(products);

    // Save order
    const orders = getOrders();
    const newOrder = {
      id: 'ord_' + randomUUID(),
      type: 'buy',
      itemId: product.id,
      itemName: product.name,
      itemPhoto: product.photo,
      category: product.category,
      price: product.price,
      buyerId,
      buyerUsername,
      buyerContact: contact,
      sellerId: product.sellerId,
      sellerUsername: product.sellerUsername || product.seller || 'Student',
      sellerContact: product.contact,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveOrders(orders);

    // Notify seller
    createNotification({
      userId: product.sellerId,
      fromUserId: buyerId,
      fromUsername: buyerUsername,
      type: 'product_sold',
      productId: id,
      productName: product.name,
      message: `🎉 @${buyerUsername} purchased your "${product.name}" for ₹${product.price}! Buyer contact: ${contact || 'N/A'}.`,
    });

    res.json({
      message: 'Product purchased successfully!',
      product,
      order: newOrder,
    });
  } catch (error) {
    console.error('Buy product error:', error);
    res.status(500).json({ message: 'Failed to purchase product.' });
  }
};

export const requestPurchase = (req, res) => {
  try {
    const { id } = req.params;
    const { message: buyerMsg } = req.body;
    const buyerId = req.user.id;
    const buyerUsername = req.user.username;

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[productIndex];

    if (product.sellerId === buyerId) {
      return res.status(400).json({ message: 'You cannot request to buy your own listed item.' });
    }

    if (product.status === 'sold') {
      return res.status(400).json({ message: 'This item has already been sold.' });
    }

    if (product.status === 'pending') {
      return res.status(400).json({ message: 'Another buyer has already sent a request for this item. Please check back later.' });
    }

    if (buyerMsg != null && typeof buyerMsg !== 'string') {
      return res.status(400).json({ message: 'Message must be text.' });
    }
    const requestId = 'REQ-BUY-' + Math.floor(1000 + Math.random() * 9000);

    // Set product to pending state
    product.status = 'pending';
    product.pendingBuyerId = buyerId;
    product.pendingBuyerUsername = buyerUsername;
    product.requestId = requestId;
    products[productIndex] = product;
    saveProducts(products);

    // Create private chat
    const autoMsg = buyerMsg || `Hi @${product.sellerUsername || 'Seller'}! I sent a purchase request (#${requestId}) for "${product.name}" for ₹${product.price}. Is it available to meet on campus?`;
    const chat = createRequestChat({ productId: id, rentId: null, productName: product.name, productPhoto: product.photo, buyerId, buyerUsername, sellerId: product.sellerId, sellerUsername: product.sellerUsername || product.seller || 'Seller' }, autoMsg);

    // Notify seller privately with 3 options: Accept, Reject, Chat
    createNotification({
      userId: product.sellerId,
      fromUserId: buyerId,
      fromUsername: buyerUsername,
      type: 'buy_request',
      requestId,
      productId: id,
      productName: product.name,
      price: product.price,
      message: `@${buyerUsername} requested to buy your "${product.name}" for ₹${product.price} (Request ID: #${requestId}). You can Accept, Reject, or Chat.`,
    });

    res.json({
      message: `Purchase request #${requestId} sent! The seller has received your notification.`,
      requestId,
      chatId: chat.id,
      product,
    });
  } catch (error) {
    console.error('Buy request error:', error);
    res.status(500).json({ message: 'Failed to send purchase request.' });
  }
};

export const approveSale = (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[productIndex];

    if (product.sellerId !== sellerId) {
      return res.status(403).json({ message: 'Permission denied. Only the seller can approve the sale.' });
    }

    if (!product.pendingBuyerId) {
      return res.status(400).json({ message: 'No pending buyer request found for this product.' });
    }

    const approvedBuyerId = product.pendingBuyerId;
    const approvedBuyerUsername = product.pendingBuyerUsername;
    const currentRequestId = product.requestId || ('REQ-BUY-' + Math.floor(1000 + Math.random() * 9000));

    product.status = 'sold';
    product.buyerId = approvedBuyerId;
    product.buyerUsername = approvedBuyerUsername;
    product.soldAt = new Date().toISOString();
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    products[productIndex] = product;
    saveProducts(products);

    const orders = getOrders();
    const newOrder = {
      id: 'ord_' + randomUUID(),
      type: 'buy',
      itemId: product.id,
      itemName: product.name,
      itemPhoto: product.photo,
      category: product.category,
      price: product.price,
      buyerId: approvedBuyerId,
      buyerUsername: approvedBuyerUsername,
      buyerContact: '',
      sellerId: product.sellerId,
      sellerUsername: product.sellerUsername || 'Seller',
      sellerContact: product.contact,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveOrders(orders);

    // Notify buyer that request was accepted
    createNotification({
      userId: approvedBuyerId,
      fromUserId: product.sellerId,
      fromUsername: product.sellerUsername,
      type: 'sale_approved',
      requestId: currentRequestId,
      productId: id,
      productName: product.name,
      price: product.price,
      message: `🎉 Great news! @${product.sellerUsername} ACCEPTED your buy request (#${currentRequestId}) for "${product.name}". The item is successfully bought by you!`,
    });

    res.json({
      message: 'Sale approved! The product is now marked as Sold and the buyer has been notified.',
      product,
      order: newOrder,
    });
  } catch (error) {
    console.error('Approve sale error:', error);
    res.status(500).json({ message: 'Failed to approve sale.' });
  }
};

export const rejectSale = (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[productIndex];

    if (product.sellerId !== sellerId) {
      return res.status(403).json({ message: 'Permission denied. Only the seller can decline this request.' });
    }

    const rejectedBuyerId = product.pendingBuyerId;
    const currentRequestId = product.requestId || ('REQ-BUY-' + Math.floor(1000 + Math.random() * 9000));

    product.status = 'available';
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    product.requestId = null;
    products[productIndex] = product;
    saveProducts(products);

    if (rejectedBuyerId) {
      createNotification({
        userId: rejectedBuyerId,
        fromUserId: product.sellerId,
        fromUsername: product.sellerUsername,
        type: 'sale_rejected',
        requestId: currentRequestId,
        productId: id,
        productName: product.name,
        message: `⚠️ Notice: @${product.sellerUsername} REJECTED your buy request (#${currentRequestId}) for "${product.name}". The item is available again for other buyers.`,
      });
    }

    res.json({ message: 'Request rejected. Product is available again and the buyer has been notified.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline request.' });
  }
};

export const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    let products = getProducts();
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this listing.' });
    }

    products = products.filter(p => p.id !== id);
    saveProducts(products);

    res.json({ message: 'Product listing removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};

