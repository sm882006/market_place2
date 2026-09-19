# 🎓 CampusMart / MarketPICT — Production Campus Marketplace

A full-stack, secure, production-grade campus marketplace platform tailored for PICT students to buy, sell, rent, track transactions, and recover lost belongings within a trusted student community.

---

## 🚀 Key Features & Capabilities

### 🗄️ Backend & Database (MongoDB & Mongoose)
- **MongoDB Database**: Replaced legacy JSON-file storage with scalable MongoDB collections via Mongoose.
- **10 Core Mongoose Schemas**:
  - `User`: Roles (`student`, `admin`), college roll number, department, OTP verification, reputation average (`ratingsAverage`, `ratingsCount`), and `blockedUsers`.
  - `Product`: Marketplace items with price, condition, original price, view count, seller details, buyer details, and full-text search indexing.
  - `Rental`: Daily rental listings with deposit, duration, and `bookedRanges` array for calendar overlap prevention.
  - `Order`: Transaction tracking with order type (`buy` or `rent`), price, deposit, status timeline stepper (`pending` → `approved` → `completed` / `returned`), and review state.
  - `Chat`: Real-time conversation threads and messages.
  - `Notification`: Direct alerts for buy/rent requests, order updates, and chat messages.
  - `LostFound`: Reports with categorisation, date, location, description, photo, and claimed state.
  - `Wishlist`: Student saved items with unique indexes.
  - `Review`: Verified 1–5 star ratings and reviews linked to completed orders.
  - `Report`: Moderation reports on inappropriate listings or scams.
- **Automated Data Migration**:
  - Automatically migrates and normalises all records from legacy `users.json`, `products.json`, `rents.json`, `orders.json`, `chats.json`, and `lostfound.json` into MongoDB on server startup.
- **Security**:
  - JWT authentication with secure password hashing (`bcryptjs`).
  - Strict role-based access control (`verifyToken`, `requireAdmin`).
  - No hardcoded secrets; fully driven by `.env`.

---

### 🛒 Marketplace
- **Search, Filters & Sorting**:
  - Full-text search across titles and descriptions.
  - Filter by category, condition (`New`, `Like New`, `Good`, `Fair`), price ranges, and sort by price, date, or views.
- **Dedicated Product Details Page** (`/marketplace/:id`):
  - View count tracking.
  - High-res photo display, condition tags, discount percentage calculation.
  - Seller trust card with average star rating, department, and **Verified Student** badge.
  - Instant "Request to Buy", "Chat with Seller", "Save to Wishlist", and "Report Listing" modals.
  - Similar products recommendations.

---

### 🏠 Rental Marketplace with Overlap Prevention
- **Calendar Date Selection**:
  - Students select rental start date and duration.
- **Cost Calculation**:
  - Calculates `Rent (Days × Rate) + Refundable Security Deposit = Total Due`.
- **Booking Conflict Prevention**:
  - When a booking is submitted or approved, the backend checks date ranges against all active bookings in `bookedRanges`. Conflicting dates are rejected with HTTP 409 Conflict.

---

### 🔍 Lost & Found with Smart Matching Engine
- **Smart AI Matching** (`/api/lostfound/matches/:id`):
  - Automatically matches lost reports with found reports on campus.
  - Computes confidence scores based on category (+40%), campus location (+30%), and title/description keywords (+30%).
  - Integrated "✨ Matches" button and modal on item cards for quick claiming.

---

### 📦 Order Status Tracking & Seller Reputation
- **Visual Status Timeline** (`/orders`):
  - Stepper tracking every transaction: `Requested` → `Approved` → `Completed / Returned`.
  - Seller approval and handover completion actions.
- **Verified Seller Ratings & Reviews**:
  - Upon order completion, buyers can leave 1–5 star ratings and written feedback.
  - Seller profile dynamically displays verified average rating and review counts.

---

### ⚡ Real-Time Chat & Notification Center
- **Socket.IO Integration**:
  - Real-time 1-on-1 private messaging and instant desktop/app notifications.
  - Personal user rooms and per-conversation chat rooms.
  - Full REST fallback for offline compatibility.

---

### 🛡️ Admin Moderation Dashboard (`/admin`)
- Accessible to users with `admin` privileges.
- Overview cards: total registered students, marketplace items, active rentals, completed orders, and pending reports.
- Moderation table for reviewing and actioning student reports or deleting flagged items.
- Student account verification toggle.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vite 8, Socket.IO Client, CSS3 (Glassmorphism design system).
- **Backend**: Node.js, Express 5, MongoDB, Mongoose 9, Socket.IO 4, JSONWebToken, BcryptJS.
- **Testing**: Node test suite with native fetch (`test/integration.test.js`).

---

## 📂 Project Architecture

```bash
market_place2/
├── server/                           # Express Backend REST API & Socket.IO (Port 5001)
│   ├── config/
│   │   └── db.js                     # MongoDB connection setup
│   ├── middleware/
│   │   └── auth.js                   # JWT auth & admin authorization middleware
│   ├── models/                       # Mongoose schemas (10 models)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Rental.js
│   │   ├── Order.js
│   │   ├── Chat.js
│   │   ├── Notification.js
│   │   ├── LostFound.js
│   │   ├── Wishlist.js
│   │   ├── Review.js
│   │   └── Report.js
│   ├── routes/                       # Modular REST API endpoints
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── rentals.js
│   │   ├── orders.js
│   │   ├── lostfound.js
│   │   ├── chats.js
│   │   ├── notifications.js
│   │   ├── wishlist.js
│   │   ├── reviews.js
│   │   ├── reports.js
│   │   └── admin.js
│   ├── scripts/
│   │   └── migrateData.js            # Auto-migration script from JSON to MongoDB
│   ├── sockets/
│   │   └── chatSocket.js             # Real-time Socket.IO event handlers
│   └── server.js                     # Server entry point
│
├── src/                              # React Frontend (Port 5173)
│   ├── context/
│   │   ├── AuthContext.jsx           # Global auth state & token verification
│   │   └── ToastContext.jsx          # Global non-intrusive toast notification system
│   ├── components/                   # Reusable UI components
│   │   ├── Navbar.jsx                # Global navigation with user badge & logout
│   │   ├── StarRating.jsx            # Interactive & display star ratings
│   │   ├── LoadingSkeleton.jsx       # Perceived performance skeleton cards
│   │   └── Toast.jsx / Toast.css     # Toast alert notifications
│   ├── services/
│   │   ├── api.js                    # Authenticated fetch wrapper
│   │   └── socket.js                 # Socket.IO client singleton
│   ├── pages/
│   │   ├── Home/                     # Landing & Showcase cards
│   │   ├── Marketplace/              # BuySell & SellItem
│   │   ├── ProductDetail/            # Dedicated product details page
│   │   ├── Rent/                     # Rental listings & calendar booking
│   │   ├── LostFound/                # Lost & Found listings with smart matching
│   │   ├── Orders/                   # Order tracking timeline & review modal
│   │   ├── Admin/                    # Admin moderation dashboard
│   │   └── Profile/                  # Student profile with OTP verification & reviews
│   ├── App.jsx                       # Master Route Table
│   └── index.css                     # Global styles
│
├── test/
│   └── integration.test.js           # Comprehensive 17-scenario backend test suite
├── .env                              # Environment variables (PORT, MONGODB_URI, JWT_SECRET)
├── .env.example                      # Template environment variables
├── vite.config.js                    # Vite configuration with API & WebSocket proxy
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **MongoDB**: Community Server installed and running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI.

### 2. Environment Configuration
Ensure `.env` exists in the project root:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/campus_marketplace
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
You can run the backend server and frontend development server concurrently:

**Start Backend Server**:
```bash
npm run server
```
*Backend runs on `http://localhost:5001` with MongoDB connected and Socket.IO active.*

**Start Frontend Development Server**:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173` (with Vite proxying `/api` and `/socket.io` to port 5001).*

---

## 🧪 Testing & Verification

Run the full end-to-end integration test suite against the running backend:
```bash
node test/integration.test.js
```
Expected output:
```
--- STARTING MARKETPLACE INTEGRATION TESTS ---
[1] Health Check
  ✓ Health check returns MongoDB connected
[2] Student Authentication & Registration
  ✓ Registered new student
[3] Login
  ✓ Logged in successfully with JWT token
[4] Student Verification OTP
  ✓ OTP generation requested successfully
[5] Product Creation & Marketplace Search
  ✓ Created product listing
  ✓ Search returned product
  ✓ Product detail returned views count and seller info
[6] Buy Request & Order Flow
  ✓ Buy request created pending Order record
  ✓ Seller approved sale; product marked as "sold"
[7] Order Tracking & Review Flow
  ✓ Order tracking reflects completed status and timeline
  ✓ Review submitted successfully; seller reputation updated
[8] Rental Booking & Overlap Prevention
  ✓ Created rental listing
  ✓ First rental booking submitted
  ✓ Owner approved first rental booking
  ✓ Overlapping rental request successfully REJECTED with 409 Conflict
[9] Lost & Found Smart Matching Engine
  ✓ Smart Match Engine correctly identified matching lost & found items
[10] Admin Controls & Moderation
  ✓ Non-admin users are strictly blocked (403 Forbidden) from admin dashboard

==============================================
SUMMARY: 17 PASSED, 0 FAILED
==============================================
```

Check code quality and compile the production bundle:
```bash
npm run lint
npm run build
```