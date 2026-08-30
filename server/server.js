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

// Initialize initial sample data if empty and users exist
function initializeDatabase() {
  const users = getUsers();
  const products = getProducts();
  const rents = getRents();
  const lostfound = getLostFound();

  // If products are empty, add a clean initial sample tied to first available user
  if (products.length === 0 && users.length > 0) {
    const seller = users[0];
    const initialProducts = [
      {
        id: 'prod_' + Date.now(),
        name: 'Casio Scientific Calculator FX-991EX',
        price: 750,
        condition: 'Like New',
        handleTime: 'Immediate handover',
        contact: '9876543210',
        category: 'Electronics & Gadgets',
        description: 'Casio fx-991EX ClassWiz scientific calculator in perfect working condition. Ideal for FE/SE engineering students.',
        photo: 'https://images.unsplash.com/photo-1629739835749-01f11c79f32e?q=80&w=400&auto=format&fit=crop',
        sellerId: seller.id,
        sellerUsername: seller.username,
        status: 'available',
        buyerId: null,
        buyerUsername: null,
        createdAt: new Date().toISOString(),
        soldAt: null,
      }
    ];
    saveProducts(initialProducts);
  }

  // If rents are empty, initialize sample
  if (rents.length === 0 && users.length > 1) {
    const owner = users[1] || users[0];
    const initialRents = [
      {
        id: 'rent_' + Date.now(),
        name: 'Engineering Drawing Board & Mini Drafter',
        category: 'Lab & Drawing Kits',
        rentPerDay: 30,
        deposit: 300,
        availableFrom: new Date().toISOString().split('T')[0],
        availableTill: '2026-12-31',
        condition: 'Good',
        contact: '9988776655',
        description: 'Clean drawing board with mini drafter, clamp, and storage bag. Ready for semester practicals.',
        photo: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop',
        ownerId: owner.id,
        ownerUsername: owner.username,
        status: 'available',
        renterId: null,
        renterUsername: null,
        createdAt: new Date().toISOString(),
        rentedAt: null,
      }
    ];
    saveRents(initialRents);
  }

  // If lost & found is empty, initialize sample
  if (lostfound.length === 0 && users.length > 0) {
    const reporter = users[0];
    const initialLF = [
      {
        id: 'lf_' + Date.now(),
        name: 'College ID Card & Lanyard',
        location: 'Library Reading Hall',
        date: new Date().toISOString().split('T')[0],
        category: 'ID Cards & Wallets',
        description: 'Found blue PICT student ID card on table 14 near the windows.',
        contact: '9876543210',
        photo: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop',
        status: 'unclaimed',
        reportedById: reporter.id,
        reportedByUsername: reporter.username,
        claimedById: null,
        claimedByUsername: null,
        createdAt: new Date().toISOString(),
      }
    ];
    saveLostFound(initialLF);
  }
}

initializeDatabase();

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

// Optional Auth (populates req.user if token is present)
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // ignore expired / invalid for optional
    }
  }
  next();
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

// GET /api/profile (Protected)
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

// GET /api/products - Get all products (with optional ?status=available filter)
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

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  }
});

// POST /api/products - Create a new product listing (Protected)
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

// POST /api/products/:id/buy - Buy a product (Protected)
app.post('/api/products/:id/buy', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const buyerUsername = req.user.username;
    const { contact } = req.body;

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[productIndex];

    if (product.sellerId === buyerId) {
      return res.status(400).json({ message: 'You cannot buy your own listed product.' });
    }

    if (product.status === 'sold') {
      return res.status(400).json({ message: 'This item has already been sold.' });
    }

    // Update product status
    product.status = 'sold';
    product.buyerId = buyerId;
    product.buyerUsername = buyerUsername;
    product.soldAt = new Date().toISOString();
    products[productIndex] = product;
    saveProducts(products);

    // Create an order record
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
      buyerContact: contact || '',
      sellerId: product.sellerId,
      sellerUsername: product.sellerUsername,
      sellerContact: product.contact,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    saveOrders(orders);

    res.json({
      message: 'Product purchased successfully!',
      order: newOrder,
      product,
    });
  } catch (error) {
    console.error('Buy product error:', error);
    res.status(500).json({ message: 'Failed to complete purchase.' });
  }
});

// DELETE /api/products/:id - Delete a product listing (Protected, owner only)
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
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

// ==================== RENT ROUTES ====================

// GET /api/rents - Get all rental items
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
    console.error('Fetch rents error:', error);
    res.status(500).json({ message: 'Failed to retrieve rental items.' });
  }
});

// POST /api/rents - List a product for rent (Protected)
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
    };

    rents.push(newRent);
    saveRents(rents);

    res.status(201).json({
      message: 'Rent item listed successfully!',
      rentItem: newRent,
    });
  } catch (error) {
    console.error('Add rent error:', error);
    res.status(500).json({ message: 'Failed to list rent item.' });
  }
});

// POST /api/rents/:id/rent - Rent an item (Protected)
app.post('/api/rents/:id/rent', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const renterId = req.user.id;
    const renterUsername = req.user.username;
    const { days = 1, contact } = req.body;

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

    item.status = 'rented';
    item.renterId = renterId;
    item.renterUsername = renterUsername;
    item.rentedAt = new Date().toISOString();
    rents[rentIndex] = item;
    saveRents(rents);

    // Record order
    const totalAmount = (item.rentPerDay * (parseInt(days, 10) || 1)) + (item.deposit || 0);
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
      rentDays: parseInt(days, 10) || 1,
      totalAmount,
      buyerId: renterId,
      buyerUsername: renterUsername,
      buyerContact: contact || '',
      sellerId: item.ownerId,
      sellerUsername: item.ownerUsername,
      sellerContact: item.contact,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    saveOrders(orders);

    res.json({
      message: 'Item rented successfully!',
      order: newOrder,
      rentItem: item,
    });
  } catch (error) {
    console.error('Rent item error:', error);
    res.status(500).json({ message: 'Failed to rent item.' });
  }
});

// DELETE /api/rents/:id - Delete a rent listing (Protected, owner only)
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
    console.error('Delete rent error:', error);
    res.status(500).json({ message: 'Failed to delete rent listing.' });
  }
});

// ==================== LOST & FOUND ROUTES ====================

// GET /api/lostfound - Get all lost & found items
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
    console.error('Fetch lost & found error:', error);
    res.status(500).json({ message: 'Failed to retrieve lost & found items.' });
  }
});

// POST /api/lostfound - Report found/lost item (Protected)
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
    console.error('Add lost & found error:', error);
    res.status(500).json({ message: 'Failed to report item.' });
  }
});

// PATCH /api/lostfound/:id/claim - Claim item (Protected)
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
    console.error('Claim lost & found error:', error);
    res.status(500).json({ message: 'Failed to claim item.' });
  }
});

// DELETE /api/lostfound/:id - Delete lost & found listing (Protected, reporter only)
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
    console.error('Delete lost & found error:', error);
    res.status(500).json({ message: 'Failed to delete report.' });
  }
});

// ==================== ORDERS ROUTES ====================

// GET /api/orders - Get user's orders (bought / sold / rented) (Protected)
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
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
});

// ==================== UNIFIED USER ACTIVITY ROUTE ====================

// GET /api/user/activity - Aggregates activity specifically for the authenticated user (Protected)
app.get('/api/user/activity', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const products = getProducts();
    const rents = getRents();
    const orders = getOrders();
    const lostfound = getLostFound();

    const activities = [];

    // 1. Items listed to SELL by this user
    products
      .filter(p => p.sellerId === userId || (!p.sellerId && p.seller === username))
      .forEach(p => {
        activities.push({
          id: 'act_prod_' + p.id,
          rawId: p.id,
          type: 'sell_listing',
          title: p.name,
          category: p.category,
          price: p.price,
          status: p.status, // 'available' | 'sold'
          statusLabel: p.status === 'sold' ? `Sold to @${p.buyerUsername || 'buyer'}` : 'Listed for Sale',
          photo: p.photo,
          date: p.createdAt,
          canDelete: p.status === 'available',
          details: p.description,
          contact: p.contact,
        });
      });

    // 2. Items listed for RENT by this user
    rents
      .filter(r => r.ownerId === userId || (!r.ownerId && r.ownerUsername === username))
      .forEach(r => {
        activities.push({
          id: 'act_rent_' + r.id,
          rawId: r.id,
          type: 'rent_listing',
          title: r.name,
          category: r.category,
          price: r.rentPerDay,
          priceUnit: '/day',
          status: r.status, // 'available' | 'rented'
          statusLabel: r.status === 'rented' ? `Rented to @${r.renterUsername || 'student'}` : 'Listed for Rent',
          photo: r.photo,
          date: r.createdAt,
          canDelete: r.status === 'available',
          details: r.description,
          contact: r.contact,
        });
      });

    // 3. Items BOUGHT or RENTED by this user (from orders)
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
          statusLabel: o.type === 'rent' ? `Rented from @${o.sellerUsername}` : `Bought from @${o.sellerUsername}`,
          photo: o.itemPhoto,
          date: o.createdAt,
          canDelete: false,
          details: `Order #${o.id.slice(-6)} • Seller: @${o.sellerUsername} (${o.sellerContact || 'N/A'})`,
          contact: o.sellerContact,
        });
      });

    // 4. Lost & Found items reported by this user
    lostfound
      .filter(lf => lf.reportedById === userId || (!lf.reportedById && lf.reportedByUsername === username))
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
          details: `Location: ${lf.location} • Date: ${lf.date}`,
          contact: lf.contact,
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

