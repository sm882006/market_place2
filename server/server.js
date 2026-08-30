import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5001;
const JWT_SECRET = 'market_pict_secret_key_2026';

// Storage file paths
const USERS_FILE = join(__dirname, 'users.json');
const PRODUCTS_FILE = join(__dirname, 'products.json');
const RENTS_FILE = join(__dirname, 'rents.json');
const ORDERS_FILE = join(__dirname, 'orders.json');
const LOSTFOUND_FILE = join(__dirname, 'lostfound.json');
const NOTIFICATIONS_FILE = join(__dirname, 'notifications.json');
const CHATS_FILE = join(__dirname, 'chats.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== STORAGE HELPERS ====================

function readFile(filePath, defaultValue = []) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try {
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeFile(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

const getUsers = () => readFile(USERS_FILE, []);
const saveUsers = (users) => writeFile(USERS_FILE, users);

const getProducts = () => readFile(PRODUCTS_FILE, []);
const saveProducts = (products) => writeFile(PRODUCTS_FILE, products);

const getRents = () => readFile(RENTS_FILE, []);
const saveRents = (rents) => writeFile(RENTS_FILE, rents);

const getOrders = () => readFile(ORDERS_FILE, []);
const saveOrders = (orders) => writeFile(ORDERS_FILE, orders);

const getLostFound = () => readFile(LOSTFOUND_FILE, []);
const saveLostFound = (items) => writeFile(LOSTFOUND_FILE, items);

const getNotifications = () => readFile(NOTIFICATIONS_FILE, []);
const saveNotifications = (n) => writeFile(NOTIFICATIONS_FILE, n);

const getChats = () => readFile(CHATS_FILE, []);
const saveChats = (c) => writeFile(CHATS_FILE, c);

// ==================== AUTH HELPERS ====================

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

// Helper: create a private notification for a specific user
function createNotification({ userId, fromUserId, fromUsername, type, productId, rentId, productName, message }) {
  if (!userId) return null;
  const notifications = getNotifications();
  const notif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    userId,
    fromUserId,
    fromUsername,
    type,
    productId: productId || null,
    rentId: rentId || null,
    productName: productName || '',
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notif);
  saveNotifications(notifications);
  return notif;
}

// ==================== AUTH ROUTES ====================

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ message: 'Username already taken.' });
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// GET /api/profile
app.get('/api/profile', authMiddleware, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// ==================== PRODUCTS (BUY & SELL) ROUTES ====================

// GET /api/products
app.get('/api/products', (req, res) => {
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
});

// POST /api/products
app.post('/api/products', authMiddleware, (req, res) => {
  try {
    const { name, price, originalPrice, handleTime, contact, category, condition, description, photo } = req.body;

    if (!name || !price || !contact || !category) {
      return res.status(400).json({ message: 'Name, price, contact number, and category are required.' });
    }

    const products = getProducts();

    const newProduct = {
      id: 'prod_' + Date.now().toString(),
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
});

// ─── POST /api/products/:id/buy ─── Direct Buy Action
app.post('/api/products/:id/buy', authMiddleware, (req, res) => {
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
      id: 'ord_' + Date.now().toString(),
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
});

// ─── POST /api/products/:id/buy-request ─── Send Buy Request & Open 1-on-1 Private Chat
app.post('/api/products/:id/buy-request', authMiddleware, (req, res) => {
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

    // Set product to pending state
    product.status = 'pending';
    product.pendingBuyerId = buyerId;
    product.pendingBuyerUsername = buyerUsername;
    products[productIndex] = product;
    saveProducts(products);

    // Create private chat
    const chats = getChats();
    let chat = chats.find(c => c.productId === id && c.buyerId === buyerId && c.sellerId === product.sellerId);
    if (!chat) {
      chat = {
        id: 'chat_' + Date.now().toString(),
        productId: id,
        rentId: null,
        productName: product.name,
        productPhoto: product.photo,
        buyerId,
        buyerUsername,
        sellerId: product.sellerId,
        sellerUsername: product.sellerUsername || product.seller || 'Seller',
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      chats.push(chat);
      saveChats(chats);
    }

    const autoMsg = buyerMsg || `Hi! I want to buy your "${product.name}" for ₹${product.price}. Is it available to meet on campus?`;
    const chatIndex = chats.findIndex(c => c.id === chat.id);
    chats[chatIndex].messages.push({
      id: 'msg_' + Date.now(),
      senderId: buyerId,
      senderUsername: buyerUsername,
      text: autoMsg,
      timestamp: new Date().toISOString(),
    });
    chats[chatIndex].lastMessageAt = new Date().toISOString();
    saveChats(chats);

    // Notify seller privately
    createNotification({
      userId: product.sellerId,
      fromUserId: buyerId,
      fromUsername: buyerUsername,
      type: 'buy_request',
      productId: id,
      productName: product.name,
      message: `@${buyerUsername} requested to buy your "${product.name}" for ₹${product.price}. Chat to coordinate and approve the sale.`,
    });

    res.json({
      message: 'Purchase request sent! The seller has been notified.',
      chatId: chat.id,
      product,
    });
  } catch (error) {
    console.error('Buy request error:', error);
    res.status(500).json({ message: 'Failed to send purchase request.' });
  }
});

// ─── POST /api/products/:id/approve-sale ─── Seller Approves Sale
app.post('/api/products/:id/approve-sale', authMiddleware, (req, res) => {
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
      id: 'ord_' + Date.now().toString(),
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

    createNotification({
      userId: approvedBuyerId,
      fromUserId: product.sellerId,
      fromUsername: product.sellerUsername,
      type: 'sale_approved',
      productId: id,
      productName: product.name,
      message: `🎉 @${product.sellerUsername} approved your purchase! "${product.name}" is now marked as sold to you.`,
    });

    res.json({
      message: 'Sale approved! The product is now marked as Sold.',
      product,
      order: newOrder,
    });
  } catch (error) {
    console.error('Approve sale error:', error);
    res.status(500).json({ message: 'Failed to approve sale.' });
  }
});

// ─── POST /api/products/:id/reject-sale ─── Seller Declines Sale
app.post('/api/products/:id/reject-sale', authMiddleware, (req, res) => {
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

    product.status = 'available';
    product.pendingBuyerId = null;
    product.pendingBuyerUsername = null;
    products[productIndex] = product;
    saveProducts(products);

    if (rejectedBuyerId) {
      createNotification({
        userId: rejectedBuyerId,
        fromUserId: product.sellerId,
        fromUsername: product.sellerUsername,
        type: 'sale_rejected',
        productId: id,
        productName: product.name,
        message: `Sorry, @${product.sellerUsername} declined your request for "${product.name}". The item is available for other buyers.`,
      });
    }

    res.json({ message: 'Request declined. Product is available again.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline request.' });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authMiddleware, (req, res) => {
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
});

// ==================== RENT ROUTES ====================

// GET /api/rents
app.get('/api/rents', (req, res) => {
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
});

// POST /api/rents
app.post('/api/rents', authMiddleware, (req, res) => {
  try {
    const { name, category, rentPerDay, deposit, availableFrom, availableTill, description, contact, photo, condition } = req.body;

    if (!name || !rentPerDay || !contact || !category) {
      return res.status(400).json({ message: 'Name, Rent per day, Contact number, and Category are required.' });
    }

    const rents = getRents();
    const newRent = {
      id: 'rent_' + Date.now().toString(),
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
});

// ─── POST /api/rents/:id/rent ─── Direct Rent Action
app.post('/api/rents/:id/rent', authMiddleware, (req, res) => {
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
      id: 'ord_' + Date.now().toString(),
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
});

// ─── POST /api/rents/:id/rent-request ─── Send Rent Request
app.post('/api/rents/:id/rent-request', authMiddleware, (req, res) => {
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
      return res.status(400).json({ message: 'Another student has already sent a request for this rental.' });
    }

    item.status = 'pending';
    item.pendingRenterId = renterId;
    item.pendingRenterUsername = renterUsername;
    item.pendingDays = parseInt(days, 10) || 1;
    rents[rentIndex] = item;
    saveRents(rents);

    const chats = getChats();
    let chat = chats.find(c => c.rentId === id && c.buyerId === renterId && c.sellerId === item.ownerId);
    if (!chat) {
      chat = {
        id: 'chat_' + Date.now().toString(),
        rentId: id,
        productId: null,
        productName: item.name,
        productPhoto: item.photo,
        buyerId: renterId,
        buyerUsername: renterUsername,
        sellerId: item.ownerId,
        sellerUsername: item.ownerUsername || 'Owner',
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      chats.push(chat);
      saveChats(chats);
    }

    const autoMsg = renterMsg || `Hi! I would like to rent your "${item.name}" for ${days} day(s). When and where can we meet?`;
    const chatIndex = chats.findIndex(c => c.id === chat.id);
    chats[chatIndex].messages.push({
      id: 'msg_' + Date.now(),
      senderId: renterId,
      senderUsername: renterUsername,
      text: autoMsg,
      timestamp: new Date().toISOString(),
    });
    chats[chatIndex].lastMessageAt = new Date().toISOString();
    saveChats(chats);

    createNotification({
      userId: item.ownerId,
      fromUserId: renterId,
      fromUsername: renterUsername,
      type: 'rent_request',
      rentId: id,
      productName: item.name,
      message: `@${renterUsername} requested to rent your "${item.name}" for ${days} day(s). Chat to coordinate and approve.`,
    });

    res.json({ message: 'Rent request sent! The owner will be notified.', chatId: chat.id, item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send rent request.' });
  }
});

// ─── POST /api/rents/:id/approve-rent ───
app.post('/api/rents/:id/approve-rent', authMiddleware, (req, res) => {
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
      id: 'ord_' + Date.now().toString(),
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

    createNotification({
      userId: approvedRenterId,
      fromUserId: item.ownerId,
      fromUsername: item.ownerUsername,
      type: 'rent_approved',
      rentId: id,
      productName: item.name,
      message: `🎉 @${item.ownerUsername} approved your rent request for "${item.name}"!`,
    });

    res.json({ message: 'Rent approved! The item is marked as Rented.', item, order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve rent.' });
  }
});

// ─── POST /api/rents/:id/reject-rent ───
app.post('/api/rents/:id/reject-rent', authMiddleware, (req, res) => {
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
    item.status = 'available';
    item.pendingRenterId = null;
    item.pendingRenterUsername = null;
    item.pendingDays = null;
    rents[rentIndex] = item;
    saveRents(rents);

    if (rejectedRenterId) {
      createNotification({
        userId: rejectedRenterId,
        fromUserId: item.ownerId,
        fromUsername: item.ownerUsername,
        type: 'rent_rejected',
        rentId: id,
        productName: item.name,
        message: `Sorry, @${item.ownerUsername} declined your rent request for "${item.name}". The item is available again.`,
      });
    }

    res.json({ message: 'Request declined. Rental is back to available.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline rent request.' });
  }
});

// DELETE /api/rents/:id
app.delete('/api/rents/:id', authMiddleware, (req, res) => {
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
});

// ==================== LOST & FOUND ROUTES ====================

app.get('/api/lostfound', (req, res) => {
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
});

app.post('/api/lostfound', authMiddleware, (req, res) => {
  try {
    const { name, location, date, category, description, contact, photo } = req.body;

    if (!name || !location || !contact) {
      return res.status(400).json({ message: 'Item name, place found, and contact number are required.' });
    }

    const items = getLostFound();
    const newItem = {
      id: 'lf_' + Date.now().toString(),
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
});

app.patch('/api/lostfound/:id/claim', authMiddleware, (req, res) => {
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
});

app.delete('/api/lostfound/:id', authMiddleware, (req, res) => {
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
});

// ==================== ORDERS ROUTES ====================

app.get('/api/orders', authMiddleware, (req, res) => {
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
});

// ==================== NOTIFICATIONS ROUTES (Strictly Private to Logged-in User) ====================

// GET /api/notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = getNotifications();
    const userNotifs = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userNotifs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const notifications = getNotifications();
    const idx = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'Notification not found.' });
    notifications[idx].isRead = true;
    saveNotifications(notifications);
    res.json({ message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
});

// PATCH /api/notifications/read-all
app.patch('/api/notifications/read-all', authMiddleware, (req, res) => {
  try {
    const notifications = getNotifications();
    notifications.forEach(n => { if (n.userId === req.user.id) n.isRead = true; });
    saveNotifications(notifications);
    res.json({ message: 'All marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
});

// DELETE /api/notifications/:id
app.delete('/api/notifications/:id', authMiddleware, (req, res) => {
  try {
    let notifications = getNotifications();
    notifications = notifications.filter(n => !(n.id === req.params.id && n.userId === req.user.id));
    saveNotifications(notifications);
    res.json({ message: 'Notification dismissed.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dismiss notification.' });
  }
});

// ==================== CHAT ROUTES (Strictly Private 1-on-1) ====================

// GET /api/chats
app.get('/api/chats', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const chats = getChats();
    const userChats = chats
      .filter(c => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(userChats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve chats.' });
  }
});

// GET /api/chats/:chatId
app.get('/api/chats/:chatId', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied. This is a private conversation.' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve chat.' });
  }
});

// POST /api/chats/:chatId/message
app.post('/api/chats/:chatId/message', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const chats = getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return res.status(404).json({ message: 'Chat not found.' });

    const chat = chats[chatIndex];
    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: userId,
      senderUsername: username,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    chats[chatIndex].messages.push(newMsg);
    chats[chatIndex].lastMessageAt = new Date().toISOString();
    saveChats(chats);

    const recipientId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
    createNotification({
      userId: recipientId,
      fromUserId: userId,
      fromUsername: username,
      type: 'chat_message',
      productId: chat.productId,
      rentId: chat.rentId,
      productName: chat.productName,
      message: `@${username}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
    });

    res.json({ message: 'Message sent!', msg: newMsg });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

// ==================== UNIFIED USER ACTIVITY ROUTE ====================

// GET /api/user/activity
app.get('/api/user/activity', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const products = getProducts();
    const rents = getRents();
    const orders = getOrders();
    const lostfound = getLostFound();

    const activities = [];

    // 1. Items listed to SELL by THIS user
    products
      .filter(p => p.sellerId === userId || (!p.sellerId && (p.seller === username || p.sellerUsername === username)))
      .forEach(p => {
        let statusLabel = 'Listed for Sale';
        if (p.status === 'sold') statusLabel = `🏷️ Sold to @${p.buyerUsername || 'buyer'}`;
        else if (p.status === 'pending') statusLabel = `⏳ Pending Request from @${p.pendingBuyerUsername}`;

        activities.push({
          id: 'act_prod_' + p.id,
          rawId: p.id,
          type: 'sell_listing',
          title: p.name,
          category: p.category,
          price: p.price,
          status: p.status,
          statusLabel,
          photo: p.photo,
          date: p.createdAt,
          canDelete: p.status === 'available',
          canApprove: p.status === 'pending',
          pendingBuyerId: p.pendingBuyerId,
          pendingBuyerUsername: p.pendingBuyerUsername,
          details: p.description,
          contact: p.contact,
          deleteEndpoint: '/api/products/' + p.id,
          approveEndpoint: '/api/products/' + p.id + '/approve-sale',
          rejectEndpoint: '/api/products/' + p.id + '/reject-sale',
        });
      });

    // 2. Items listed for RENT by THIS user
    rents
      .filter(r => r.ownerId === userId || (!r.ownerId && r.ownerUsername === username))
      .forEach(r => {
        let statusLabel = 'Listed for Rent';
        if (r.status === 'rented') statusLabel = `🔑 Rented to @${r.renterUsername || 'student'}`;
        else if (r.status === 'pending') statusLabel = `⏳ Pending Request from @${r.pendingRenterUsername}`;

        activities.push({
          id: 'act_rent_' + r.id,
          rawId: r.id,
          type: 'rent_listing',
          title: r.name,
          category: r.category,
          price: r.rentPerDay,
          priceUnit: '/day',
          status: r.status,
          statusLabel,
          photo: r.photo,
          date: r.createdAt,
          canDelete: r.status === 'available',
          canApprove: r.status === 'pending',
          pendingRenterId: r.pendingRenterId,
          pendingRenterUsername: r.pendingRenterUsername,
          details: r.description,
          contact: r.contact,
          deleteEndpoint: '/api/rents/' + r.id,
          approveEndpoint: '/api/rents/' + r.id + '/approve-rent',
          rejectEndpoint: '/api/rents/' + r.id + '/reject-rent',
        });
      });

    // 3. Items BOUGHT or RENTED by THIS user (orders)
    orders
      .filter(o => o.buyerId === userId)
      .forEach(o => {
        activities.push({
          id: 'act_ord_' + o.id,
          rawId: o.id,
          type: o.type === 'rent' ? 'rent_order' : 'buy_order',
          title: o.itemName,
          category: o.category,
          price: o.type === 'rent' ? o.totalAmount : o.price,
          status: 'completed',
          statusLabel: o.type === 'rent' ? `🤝 Rented from @${o.sellerUsername}` : `🛒 Bought from @${o.sellerUsername}`,
          photo: o.itemPhoto,
          date: o.createdAt,
          canDelete: false,
          canApprove: false,
          details: `Order #${o.id.slice(-6)} • Seller: @${o.sellerUsername} (${o.sellerContact || 'N/A'})`,
          contact: o.sellerContact,
        });
      });

    // 4. Pending buy requests sent by THIS user
    products
      .filter(p => p.pendingBuyerId === userId)
      .forEach(p => {
        activities.push({
          id: 'act_pending_buy_' + p.id,
          rawId: p.id,
          type: 'pending_buy',
          title: p.name,
          category: p.category,
          price: p.price,
          status: 'pending',
          statusLabel: `⏳ Awaiting approval from @${p.sellerUsername}`,
          photo: p.photo,
          date: new Date().toISOString(),
          canDelete: false,
          canApprove: false,
          details: `Your purchase request is pending seller review. Seller: @${p.sellerUsername}`,
          contact: p.contact,
        });
      });

    // 5. Pending rent requests sent by THIS user
    rents
      .filter(r => r.pendingRenterId === userId)
      .forEach(r => {
        activities.push({
          id: 'act_pending_rent_' + r.id,
          rawId: r.id,
          type: 'pending_rent',
          title: r.name,
          category: r.category,
          price: r.rentPerDay,
          priceUnit: '/day',
          status: 'pending',
          statusLabel: `⏳ Awaiting approval from @${r.ownerUsername}`,
          photo: r.photo,
          date: new Date().toISOString(),
          canDelete: false,
          canApprove: false,
          details: `Your rent request is pending owner review. Owner: @${r.ownerUsername}`,
          contact: r.contact,
        });
      });

    // 6. Lost & Found items reported by THIS user
    lostfound
      .filter(lf => lf.reportedById === userId || (!lf.reportedById && (lf.reportedBy === username || lf.reportedByUsername === username)))
      .forEach(lf => {
        activities.push({
          id: 'act_lf_' + lf.id,
          rawId: lf.id,
          type: 'lost_found_report',
          title: lf.name,
          category: lf.category,
          location: lf.location,
          status: lf.status,
          statusLabel: lf.status === 'claimed' ? 'Claimed by owner' : 'Reported in Lost & Found',
          photo: lf.photo,
          date: lf.createdAt,
          canDelete: true,
          canApprove: false,
          details: `Location: ${lf.location} • Date: ${lf.date}`,
          contact: lf.contact,
          deleteEndpoint: '/api/lostfound/' + lf.id,
        });
      });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ message: 'Failed to retrieve user activity.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
