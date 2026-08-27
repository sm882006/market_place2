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
const USERS_FILE = join(__dirname, 'users.json');
const PRODUCTS_FILE = join(__dirname, 'products.json');

const INITIAL_PRODUCTS = [
  {
    id: "prod_1",
    name: "Casio Scientific Calculator FX-991EX",
    price: 750,
    handleTime: "Immediate handover",
    contact: "9876543210",
    category: "Electronics & Gadgets",
    description: "Casio fx-991EX ClassWiz scientific calculator, in perfect condition. Ideal for mathematics, statistics, and engineering courses. Used for 1 semester only.",
    photo: "https://images.unsplash.com/photo-1629739835749-01f11c79f32e?q=80&w=400&auto=format&fit=crop",
    seller: "ami",
    createdAt: "2026-06-13T10:00:00.000Z"
  },
  {
    id: "prod_2",
    name: "Engineering Graphics Drawing Kit",
    price: 450,
    handleTime: "Within 24 hours",
    contact: "9988776655",
    category: "Lab & Drawing Kits",
    description: "Mini drafter, roller scale, sheet container, and drawing board. Perfect for first-year engineering graphics course. No damage, drawing board is clean.",
    photo: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop",
    seller: "utk",
    createdAt: "2026-06-13T10:10:00.000Z"
  }
];

// Helper: read products from file
function getProducts() {
  if (!existsSync(PRODUCTS_FILE)) {
    writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2));
  }
  const data = readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper: save products to file
function saveProducts(products) {
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper: read users from file
function getUsers() {
  if (!existsSync(USERS_FILE)) {
    writeFileSync(USERS_FILE, '[]');
  }
  const data = readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper: save users to file
function saveUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Helper: generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: verify JWT middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
}

// ==================== ROUTES ====================

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
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

    // Check duplicate username
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // Check duplicate email
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Generate token
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

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = getUsers();

    // Find user
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Generate token
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

// GET /api/products
app.get('/api/products', (req, res) => {
  try {
    const products = getProducts();
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  }
});

// POST /api/products (Protected)
app.post('/api/products', authMiddleware, (req, res) => {
  try {
    const { name, price, handleTime, contact, category, description, photo } = req.body;

    if (!name || !price || !contact || !category) {
      return res.status(400).json({ message: 'Name, price, contact number, and category are required.' });
    }

    const products = getProducts();

    const newProduct = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      handleTime: handleTime || 'Not specified',
      contact,
      category,
      description: description || '',
      photo: photo || '',
      seller: req.user.username,
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({
      message: 'Product added successfully!',
      product: newProduct
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Failed to add product.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
