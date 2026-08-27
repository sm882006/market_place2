# 🎓 Campus Marketplace

A student-focused marketplace platform where college students can buy, sell, rent, and find lost items within their campus community.

---

## 📖 About The Project

Campus Marketplace is designed to help students exchange products and services easily within their college.

Students can:

- Buy and sell products permanently
- Rent products for a specific duration
- Post and search for lost & found items
- Manage their profile and activity history

The goal is to create a trusted marketplace exclusively for students.

---

## ✨ Features

### 👤 User Authentication
- User Signup
- User Login
- Profile Management

### 🛒 Buy & Sell Marketplace
- Browse products listed by students
- Sell your own products
- Product details page
- Activity tracking

### 🏠 Rental Marketplace
- View products available for rent
- List products for rent
- Set rent amount and security deposit
- Specify availability dates

### 🔍 Lost & Found
- Report lost items
- Post found items
- Help students recover belongings

### 📊 User Dashboard
- View profile information
- View buying/selling history
- Quick access to marketplace sections

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router DOM
- CSS3

### Backend (Planned)
- Node.js
- Express.js
- MongoDB

### Authentication
- JWT Authentication

---

## 📂 Project Structure

```bash
market_place/
├── server/                           # Express Backend REST API (Port 5001)
│   ├── server.js                     # Auth & Products API
│   ├── users.json                    # User credentials data store
│   └── products.json                 # Products data store
│
├── src/                              # React Frontend (Port 5173)
│   ├── assets/                       # Static media, icons, logos
│   ├── context/                      # Global Contexts (AuthContext)
│   ├── components/                   # Shared & Reusable UI elements
│   ├── pages/                        # Feature-based route pages
│   │   ├── Home/                     # Landing & Hero sections
│   │   ├── Auth/                     # Login & Signup screens
│   │   ├── Marketplace/              # Buy & Sell listings & SellItem form
│   │   ├── Rent/                     # Rent listings & RentItem form
│   │   ├── LostFound/                # Lost & Found listings & Report form
│   │   ├── Orders/                   # Order tracking & product dashboard
│   │   └── Profile/                  # User Profile & account settings
│   │
│   ├── App.jsx                       # Master Route Table
│   ├── App.css                       # Layout styles
│   ├── index.css                     # Global typography and base CSS
│   └── main.jsx                      # App root mount
│
├── index.html                        # HTML entry
├── vite.config.js                    # Vite configuration
└── package.json                      # Unified scripts and dependencies
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sm882006/market_place.git
cd market_place
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Backend & Frontend

In terminal 1 (Backend API):
```bash
npm run server
```
*Backend runs on `http://localhost:5001`*

In terminal 2 (Frontend React App):
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*


---

## 📸 Screenshots

### Profile Dashboard
(Add screenshot here)

### Buy & Sell Marketplace
(Add screenshot here)

### Rent Marketplace
(Add screenshot here)

### Lost & Found
(Add screenshot here)

---

## 🎯 Future Enhancements

- Product image uploads
- Product search and filters
- Wishlist feature
- Real-time chat between buyers and sellers
- Payment integration
- College email verification
- Product reviews and ratings
- Admin dashboard

---

## 👩‍💻 Developed By

**Amisha and Utkarsh**  
Pune Institute of Computer Technology (PICT)

---

## 📜 License

This project is developed for educational and learning purposes.