import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Rental from '../models/Rental.js';
import Order from '../models/Order.js';
import LostFound from '../models/LostFound.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

const readJsonSafe = (fileName) => {
  const filePath = path.join(serverDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err.message);
    return [];
  }
};

export const autoMigrateData = async () => {
  try {
    // 1. Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const rawUsers = readJsonSafe('users.json');
      if (rawUsers.length > 0) {
        const seenUsernames = new Set();
        const seenEmails = new Set();
        const usersToInsert = [];

        for (const u of rawUsers) {
          let uname = (u.username || '').trim();
          let email = (u.email || '').trim().toLowerCase();
          if (!uname || seenUsernames.has(uname)) continue;
          seenUsernames.add(uname);

          if (!email || seenEmails.has(email)) {
            email = `${uname}_${Date.now()}@example.com`;
          }
          seenEmails.add(email);

          usersToInsert.push({
            username: uname,
            email: email,
            password: u.password,
            role: u.role || (uname === 'admin' ? 'admin' : 'student'),
            isVerified: !!u.isVerified || uname === 'utk' || uname === 'ami',
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          });
        }

        if (usersToInsert.length > 0) {
          await User.insertMany(usersToInsert);
          console.log(`[Migration] Seeded ${usersToInsert.length} users into MongoDB.`);
        }
      }
    }

    // 2. Products
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      const rawProds = readJsonSafe('products.json');
      if (rawProds.length > 0) {
        const prodsToInsert = rawProds.map((p) => ({
          name: p.name || 'Untitled Item',
          description: p.description || '',
          price: Number(p.price) || 0,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          category: p.category || 'General',
          condition: p.condition || 'Good',
          handleTime: p.handleTime || 'Immediate handover',
          contact: p.contact || 'N/A',
          location: p.location || 'PICT Campus',
          photo: p.photo || '',
          photos: p.photos || (p.photo ? [p.photo] : []),
          sellerId: String(p.sellerId || 'system'),
          sellerUsername: p.sellerUsername || 'CampusStudent',
          status: p.status || 'available',
          buyerId: p.buyerId ? String(p.buyerId) : null,
          buyerUsername: p.buyerUsername || null,
          pendingBuyerId: p.pendingBuyerId ? String(p.pendingBuyerId) : null,
          pendingBuyerUsername: p.pendingBuyerUsername || null,
          requestId: p.requestId || null,
          soldAt: p.soldAt ? new Date(p.soldAt) : null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        }));
        await Product.insertMany(prodsToInsert);
        console.log(`[Migration] Seeded ${prodsToInsert.length} products into MongoDB.`);
      }
    }

    // 3. Rentals
    const rentCount = await Rental.countDocuments();
    if (rentCount === 0) {
      const rawRents = readJsonSafe('rents.json');
      if (rawRents.length > 0) {
        const rentsToInsert = rawRents.map((r) => ({
          name: r.name || 'Untitled Rental',
          description: r.description || '',
          category: r.category || 'General',
          rentPerDay: Number(r.rentPerDay) || 10,
          deposit: Number(r.deposit) || 0,
          condition: r.condition || 'Good',
          contact: r.contact || 'N/A',
          location: r.location || 'PICT Campus',
          photo: r.photo || '',
          photos: r.photos || (r.photo ? [r.photo] : []),
          ownerId: String(r.ownerId || 'system'),
          ownerUsername: r.ownerUsername || 'CampusStudent',
          availableFrom: r.availableFrom ? new Date(r.availableFrom) : new Date(),
          availableTill: r.availableTill ? new Date(r.availableTill) : null,
          status: r.status || 'available',
          renterId: r.renterId ? String(r.renterId) : null,
          renterUsername: r.renterUsername || null,
          pendingRenterId: r.pendingRenterId ? String(r.pendingRenterId) : null,
          pendingRenterUsername: r.pendingRenterUsername || null,
          pendingDays: Number(r.pendingDays) || 1,
          requestId: r.requestId || null,
          rentedAt: r.rentedAt ? new Date(r.rentedAt) : null,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        }));
        await Rental.insertMany(rentsToInsert);
        console.log(`[Migration] Seeded ${rentsToInsert.length} rentals into MongoDB.`);
      }
    }

    // 4. Lost & Found
    const lfCount = await LostFound.countDocuments();
    if (lfCount === 0) {
      const rawLf = readJsonSafe('lostfound.json');
      if (rawLf.length > 0) {
        const lfToInsert = rawLf.map((lf) => ({
          title: lf.name || lf.title || 'Found Item',
          type: lf.type || (lf.status === 'unclaimed' ? 'found' : 'lost'),
          category: lf.category || 'General',
          location: lf.location || 'PICT Campus',
          date: lf.date ? new Date(lf.date) : new Date(),
          description: lf.description || '',
          photo: lf.photo || '',
          contact: lf.contact || 'Campus Helpdesk',
          reporterId: String(lf.reportedById || 'system'),
          reporterUsername: lf.reportedByUsername || 'student',
          status: lf.status === 'claimed' ? 'claimed' : 'open',
          claimedBy: lf.claimedByUsername || null,
          createdAt: lf.createdAt ? new Date(lf.createdAt) : new Date(),
        }));
        await LostFound.insertMany(lfToInsert);
        console.log(`[Migration] Seeded ${lfToInsert.length} lost & found items into MongoDB.`);
      }
    }

    // 5. Orders
    const ordCount = await Order.countDocuments();
    if (ordCount === 0) {
      const rawOrders = readJsonSafe('orders.json');
      if (rawOrders.length > 0) {
        const ordersToInsert = rawOrders.map((o) => ({
          orderType: o.type || 'buy',
          itemId: String(o.itemId || 'unknown'),
          itemModel: o.type === 'rent' ? 'Rental' : 'Product',
          title: o.itemName || 'Marketplace Item',
          photo: o.itemPhoto || '',
          price: Number(o.price) || 0,
          deposit: Number(o.deposit) || 0,
          totalAmount: Number(o.price || 0) + Number(o.deposit || 0),
          rentalDays: o.rentalDays ? Number(o.rentalDays) : null,
          sellerId: String(o.sellerId || 'system'),
          sellerUsername: o.sellerUsername || 'Seller',
          buyerId: String(o.buyerId || 'system'),
          buyerUsername: o.buyerUsername || 'Buyer',
          status: o.status || 'completed',
          meetingLocation: o.meetingLocation || 'PICT Campus Quad',
          statusTimeline: [
            {
              status: o.status || 'completed',
              timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
              note: 'Order imported from previous system',
            },
          ],
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        }));
        await Order.insertMany(ordersToInsert);
        console.log(`[Migration] Seeded ${ordersToInsert.length} orders into MongoDB.`);
      }
    }

    // 6. Chats
    const chatCount = await Chat.countDocuments();
    if (chatCount === 0) {
      const rawChats = readJsonSafe('chats.json');
      if (rawChats.length > 0) {
        const chatsToInsert = rawChats.map((c) => ({
          participants: [c.buyerUsername, c.sellerUsername].filter(Boolean),
          productId: c.productId ? String(c.productId) : null,
          productTitle: c.productName || '',
          messages: (c.messages || []).map((m) => ({
            sender: m.senderUsername || 'student',
            text: m.text || '',
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            read: true,
          })),
          lastMessage:
            c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].text : '',
          lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        }));
        await Chat.insertMany(chatsToInsert);
        console.log(`[Migration] Seeded ${chatsToInsert.length} chats into MongoDB.`);
      }
    }

    // 7. Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      const rawNotifs = readJsonSafe('notifications.json');
      if (rawNotifs.length > 0) {
        const notifsToInsert = rawNotifs.slice(0, 100).map((n) => ({
          recipient: String(n.userId || n.toUserId || 'all'),
          sender: n.fromUsername || 'System',
          title: n.type || 'Notification',
          message: n.message || '',
          type:
            n.type === 'chat_message'
              ? 'chat'
              : n.type === 'buy_request'
              ? 'buy_request'
              : n.type === 'rent_request'
              ? 'rent_request'
              : 'system',
          read: !!n.isRead,
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        }));
        await Notification.insertMany(notifsToInsert);
        console.log(`[Migration] Seeded ${notifsToInsert.length} notifications into MongoDB.`);
      }
    }
  } catch (error) {
    console.error('[Migration] Error during data migration:', error.message);
  }
};
