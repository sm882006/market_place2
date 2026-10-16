import { updateAtlasIP } from "./utils/updateAtlasIP.js";
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/chatSocket.js';
import { verifyToken } from './middleware/auth.js';

// Route imports
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import rentalsRouter from './routes/rentals.js';
import ordersRouter from './routes/orders.js';
import lostfoundRouter from './routes/lostfound.js';
import chatsRouter from './routes/chats.js';
import notificationsRouter from './routes/notifications.js';
import wishlistRouter from './routes/wishlist.js';
import reviewsRouter from './routes/reviews.js';
import reportsRouter from './routes/reports.js';
import adminRouter from './routes/admin.js';

// Models for activity endpoint
import Product from './models/Product.js';
import Rental from './models/Rental.js';
import Order from './models/Order.js';
import LostFound from './models/LostFound.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

setupSocketHandlers(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Attach Socket.io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount Routes
app.use('/api', authRouter); // Supports /api/signup, /api/login, /api/profile
app.use('/api/auth', authRouter); // Supports /api/auth/register, /api/auth/verify-otp, etc.
app.use('/api/products', productsRouter);
app.use('/api/rents', rentalsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/lostfound', lostfoundRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

// UNIFIED USER ACTIVITY ROUTE (for Profile.jsx)
app.get('/api/user/activity', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const username = req.user.username;

    const [myProducts, myRents, myOrders, pendingBuys, pendingRents, myLostFound] =
      await Promise.all([
        Product.find({
          $or: [{ sellerId: userId }, { sellerUsername: username }],
        }).sort({ createdAt: -1 }),
        Rental.find({
          $or: [{ ownerId: userId }, { ownerUsername: username }],
        }).sort({ createdAt: -1 }),
        Order.find({
          $or: [{ buyerId: userId }, { buyerUsername: username }],
        }).sort({ createdAt: -1 }),
        Product.find({
          $or: [{ pendingBuyerId: userId }, { pendingBuyerUsername: username }],
        }).sort({ createdAt: -1 }),
        Rental.find({
          $or: [{ pendingRenterId: userId }, { pendingRenterUsername: username }],
        }).sort({ createdAt: -1 }),
        LostFound.find({
          $or: [{ reporterId: userId }, { reporterUsername: username }],
        }).sort({ createdAt: -1 }),
      ]);

    const activities = [];

    // 1. Items listed to SELL
    myProducts.forEach((p) => {
      let statusLabel = 'Listed for Sale';
      if (p.status === 'sold') statusLabel = `🏷️ Sold to @${p.buyerUsername || 'buyer'}`;
      else if (p.status === 'pending') statusLabel = `⏳ Pending Request from @${p.pendingBuyerUsername}`;

      const pId = p._id.toString();
      activities.push({
        id: 'act_prod_' + pId,
        rawId: pId,
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
        requestId: p.requestId,
        pendingBuyerId: p.pendingBuyerId,
        pendingBuyerUsername: p.pendingBuyerUsername,
        details: p.description,
        contact: p.contact,
        deleteEndpoint: '/api/products/' + pId,
        approveEndpoint: '/api/products/' + pId + '/approve-sale',
        rejectEndpoint: '/api/products/' + pId + '/reject-sale',
      });
    });

    // 2. Items listed to RENT
    myRents.forEach((r) => {
      let statusLabel = 'Listed for Rent';
      if (r.status === 'rented') statusLabel = `🔑 Rented to @${r.renterUsername || 'student'}`;
      else if (r.status === 'pending') statusLabel = `⏳ Pending Request from @${r.pendingRenterUsername}`;

      const rId = r._id.toString();
      activities.push({
        id: 'act_rent_' + rId,
        rawId: rId,
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
        requestId: r.requestId,
        pendingRenterId: r.pendingRenterId,
        pendingRenterUsername: r.pendingRenterUsername,
        details: r.description,
        contact: r.contact,
        deleteEndpoint: '/api/rents/' + rId,
        approveEndpoint: '/api/rents/' + rId + '/approve-rent',
        rejectEndpoint: '/api/rents/' + rId + '/reject-rent',
      });
    });

    // 3. Orders placed (Bought or Rented)
    myOrders.forEach((o) => {
      const oId = o._id.toString();
      activities.push({
        id: 'act_ord_' + oId,
        rawId: oId,
        type: o.orderType === 'rent' ? 'rent_order' : 'buy_order',
        title: o.title,
        category: o.itemModel || 'Marketplace Item',
        price: o.totalAmount || o.price,
        status: o.status,
        statusLabel:
          o.orderType === 'rent'
            ? `🤝 Rented from @${o.sellerUsername}`
            : `🛒 Bought from @${o.sellerUsername}`,
        photo: o.photo,
        date: o.createdAt,
        canDelete: false,
        canApprove: false,
        details: `Order #${oId.slice(-6)} • Seller: @${o.sellerUsername}`,
        contact: '',
      });
    });

    // 4. Pending buy requests sent
    pendingBuys.forEach((p) => {
      const pId = p._id.toString();
      activities.push({
        id: 'act_pending_buy_' + pId,
        rawId: pId,
        type: 'pending_buy',
        title: p.name,
        category: p.category,
        price: p.price,
        status: 'pending',
        statusLabel: `⏳ Awaiting approval from @${p.sellerUsername}`,
        photo: p.photo,
        date: p.updatedAt || p.createdAt,
        canDelete: false,
        canApprove: false,
        details: `Your purchase request is pending seller review. Seller: @${p.sellerUsername}`,
        contact: p.contact,
      });
    });

    // 5. Pending rent requests sent
    pendingRents.forEach((r) => {
      const rId = r._id.toString();
      activities.push({
        id: 'act_pending_rent_' + rId,
        rawId: rId,
        type: 'pending_rent',
        title: r.name,
        category: r.category,
        price: r.rentPerDay,
        priceUnit: '/day',
        status: 'pending',
        statusLabel: `⏳ Awaiting approval from @${r.ownerUsername}`,
        photo: r.photo,
        date: r.updatedAt || r.createdAt,
        canDelete: false,
        canApprove: false,
        details: `Your rent request is pending owner review. Owner: @${r.ownerUsername}`,
        contact: r.contact,
      });
    });

    // 6. Lost & Found items reported
    myLostFound.forEach((lf) => {
      const lfId = lf._id.toString();
      activities.push({
        id: 'act_lf_' + lfId,
        rawId: lfId,
        type: 'lost_found_report',
        title: lf.title,
        category: lf.category,
        location: lf.location,
        status: lf.status,
        statusLabel: lf.status === 'claimed' ? 'Claimed by owner' : 'Reported in Lost & Found',
        photo: lf.photo,
        date: lf.createdAt,
        canDelete: true,
        canApprove: false,
        details: `Location: ${lf.location} • Date: ${new Date(lf.date).toLocaleDateString()}`,
        contact: lf.contact,
        deleteEndpoint: '/api/lostfound/' + lfId,
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({
      count: activities.length,
      activities,
    });
  } catch (err) {
    console.error('[ACTIVITY] Error retrieving activity:', err);
    return res.status(500).json({ message: 'Failed to retrieve user activity.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// Serve frontend build if exists
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Connect to DB and start server
// const startServer = async () => {
//   await connectDB();

//   server.listen(PORT, () => {
//     console.log(`\n==================================================`);
//     console.log(`🚀 MarketPICT / CampusCart Backend Active`);
//     console.log(`📡 Server running on http://localhost:${PORT}`);
//     console.log(`⚡ Socket.io enabled for real-time chat & notifications`);
//     console.log(`🗄️ Connected to MongoDB (Mongoose schemas)`);
//     console.log(`==================================================\n`);
//   });
// };

// startServer().catch((error) => {
//   console.error('[Startup] Unable to start server:', error.message);
//   process.exitCode = 1;
// });

async function startServer() {
  try {
    await updateAtlasIP();

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000
    });

    console.log("MongoDB Connected Successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Backend server started");
    });
  } catch (error) {
    console.error(
      "Backend startup failed:",
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

startServer();
