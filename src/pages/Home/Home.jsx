import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../../components/LoginPromptModal';
import './Home.css';

const CATEGORIES = [
  { id: 'trending', label: 'Trending on Campus', icon: '🔥' },
  { id: 'textbooks', label: 'Semester Textbooks', icon: '📚' },
  { id: 'electronics', label: 'Electronics & Tech', icon: '💻' },
  { id: 'lab', label: 'Lab & Workshop Gear', icon: '🛠️' },
  { id: 'mobility', label: 'Campus Mobility', icon: '🚲' },
  { id: 'dorm', label: 'Dorm & Room', icon: '🏠' },
];

const TRENDING_KEYWORDS = [
  'Engineering Textbooks',
  'Scientific Calc (fx-991EX)',
  'Hostel Table & Chair',
  'PICT Cycle',
  'Arduino Uno & Sensors',
];

const LIVE_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Casio FX-991EX ClassWiz Scientific Calculator',
    category: 'textbooks',
    price: 750,
    originalPrice: 1400,
    discountBadge: '45% OFF',
    condition: 'Like New • 1 Sem Used',
    location: 'F-Building Quad',
    seller: 'Rohan M.',
    yearBranch: 'TE IT',
    verified: true,
    photo: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
  },
  {
    id: 'prod_2',
    name: 'Core Engineering Books (SPPU Sem 3 & 4 Bundle)',
    category: 'textbooks',
    price: 1100,
    subtitle: 'Set of 4',
    discountBadge: 'BUNDLE (4 BOOKS)',
    condition: 'Good • Highlighted Notes',
    location: 'Central Library Area',
    seller: 'Sneha K.',
    yearBranch: 'BE EnTC',
    verified: true,
    photo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
  },
  {
    id: 'prod_3',
    name: 'Firefox Mountain Cycle with Lock & Helmet',
    category: 'mobility',
    price: 3200,
    subtitle: 'Negotiable',
    discountBadge: 'MOVING OUT SALE',
    condition: 'Serviced Last Month',
    location: 'Hostel 2 Parking',
    seller: 'Utkarsh S.',
    yearBranch: 'Final Year Comp',
    verified: true,
    photo: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=120&auto=format&fit=crop',
  },
  {
    id: 'prod_4',
    name: 'Arduino & IoT Starter Kit with ESP32 & Sensors',
    category: 'electronics',
    price: 850,
    originalPrice: 1800,
    discountBadge: '52% OFF',
    condition: 'Tested & Working • Sealed',
    location: 'Lab 304',
    seller: 'Amey D.',
    yearBranch: 'TE Comp',
    verified: true,
    photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
  },
];

const RENT_ITEMS = [
  {
    id: 'rent_1',
    name: 'Engineering Drawing Drafter & Board',
    desc: 'Omega drafting tool with imperial board clips. Perfect for FE Graphics submissions.',
    badge: 'FE First Year Essential',
    status: 'Available this Semester',
    deposit: 'Deposit: ₹300 (100% Refundable)',
    priceDay: '₹30',
    pricePeriod: '₹180 / month',
    owner: 'Priya N. (FE Mech)',
    photo: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=120&auto=format&fit=crop',
  },
  {
    id: 'rent_2',
    name: 'Raspberry Pi 4 Model B (4GB) + Touchscreen',
    desc: 'Includes Type-C power brick, 32GB high-speed SD card flashed with Raspberry Pi OS.',
    badge: 'Capstone Ready',
    status: 'Ready for Pickup',
    deposit: 'Deposit: ₹1,000 (Refundable)',
    priceDay: '₹120 / week',
    pricePeriod: '₹400 / month',
    owner: 'Rahul V. (BE Comp)',
    photo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
  },
  {
    id: 'rent_3',
    name: 'Clean White Lab Coat & Safety Goggles',
    desc: "Mandatory for Chemistry/Physics practicals and workshop turns. Fits height 5'7\" – 6'0\".",
    badge: 'Size L • Freshly Laundered',
    status: 'Instant Handover',
    deposit: 'Deposit: ₹150 (Refundable)',
    priceDay: '₹20 / day',
    pricePeriod: '₹75 / practical week',
    owner: 'Ananya P. (FE)',
    photo: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=600&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
  },
];

const LOST_FOUND_ITEMS = [
  {
    id: 'lf_1',
    type: 'LOST ITEM',
    time: 'Tuesday, 2:15 PM',
    title: 'Blue boAt Rockerz Earbuds Case',
    desc: 'Dropped near PICT Main Canteen outdoor table #4. Contains left earbud inside.',
    tag: '🎁 ₹200 Reward / Gratitude treat at canteen',
    tagType: 'reward',
    reporter: 'Poster: Aditya K. (SE-IT)',
    actionText: 'I Found This',
  },
  {
    id: 'lf_2',
    type: 'FOUND ITEM',
    time: 'Yesterday, 5:30 PM',
    title: 'Silver Titan Metal Watch',
    desc: 'Left on Desk 14 in Computer Lab 208 during Practical session. Kept safely with Lab Attendant Mr. Patil.',
    tag: '🔒 Safe Custody: Lab 208 Staff',
    tagType: 'custody',
    reporter: 'Reported by: Lab Incharge',
    actionText: 'Claim Watch',
  },
  {
    id: 'lf_3',
    type: 'FOUND ITEM',
    time: 'Today, 10:00 AM',
    title: 'Data Structures Spiral Notebook',
    desc: 'Found on Library 2nd floor reading hall (Row C). Handwritten notes with blue pen & diagrams.',
    tag: '📖 Deposited at Central Circulation Desk',
    tagType: 'custody',
    reporter: 'Reported by: Tanvi G.',
    actionText: 'Verify Notes',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [activeCategory, setActiveCategory] = useState('trending');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for unauthenticated actions
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState(null);
  const [blockedService, setBlockedService] = useState({ name: 'Campus Marketplace', icon: '✨' });

  const handleProtectedAction = (actionDesc, serviceName, serviceIcon, targetRoute) => {
    if (!isAuthenticated) {
      setBlockedAction(actionDesc);
      setBlockedService({ name: serviceName, icon: serviceIcon });
      setShowLoginModal(true);
      return;
    }
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  return (
    <div className="campus-app-wrapper">
      {/* ── 1. Top Campus Ticker ── */}
      <div className="campus-ticker">
        <span>
          🎓 Exclusive to verified PICT campus students • Zero commission student-to-student exchange
        </span>
      </div>

      {/* ── 2. Glassmorphic Navigation Bar ── */}
      <header className="glass-navbar">
        <div className="nav-container">
          {/* Brand Logo */}
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="brand-badge-icon">
              <span className="brand-icon">🎓</span>
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">CampusCart PICT</span>
              <span className="brand-sub">
                <span className="verified-check">✓</span> Verified Student Hub
              </span>
            </div>
          </div>

          {/* Search Pill */}
          <div className="nav-search-pill" onClick={() => navigate('/orderhome')}>
            <span className="search-glass-icon">🔍</span>
            <input
              type="text"
              placeholder="Search textbooks, calculators, cycles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <kbd className="search-shortcut">Ctrl + K</kbd>
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            <button type="button" className="nav-pill active" onClick={() => navigate('/')}>
              Explore Hub
            </button>
            <button type="button" className="nav-link-btn" onClick={() => navigate('/orderhome')}>
              Buy &amp; Sell
            </button>
            <button type="button" className="nav-link-btn" onClick={() => navigate('/rent')}>
              Rentals
            </button>
            <button type="button" className="nav-link-btn" onClick={() => navigate('/lostfound')}>
              Lost &amp; Found
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => handleProtectedAction('access your listings', 'My Listings', '📑', '/profile')}
            >
              My Listings
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="nav-actions">
            <button
              type="button"
              className="btn-post-item"
              onClick={() => handleProtectedAction('post an item for sale or rent', 'Create Listing', '➕', '/sell-item')}
            >
              <span className="plus-bubble">⊕</span> Post an Item
            </button>

            <button
              type="button"
              className="nav-icon-btn"
              title="Notifications"
              onClick={() => handleProtectedAction('view your notifications', 'Notifications', '🔔', '/profile')}
            >
              <span className="bell-icon">🔔</span>
              <span className="notif-red-dot" />
            </button>

            {isAuthenticated ? (
              <div className="nav-user-pill" onClick={() => navigate('/profile')}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                  alt="Avatar"
                  className="user-avatar-img"
                />
                <div className="user-info-text">
                  <span className="user-name">{user?.username || 'Amisha P.'}</span>
                  <span className="user-branch">
                    BE-Comp <span className="verified-dot">●</span>
                  </span>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-sign-in" onClick={() => navigate('/login')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 3. Hero Section with Glassmorphic Elements ── */}
      <section className="hero-glass-section">
        <div className="content-container">
          {/* Trust Banner Badge */}
          <div className="hero-trust-badge">
            <span className="shield-icon">🛡️</span>
            <span>Pune Institute of Computer Technology • Official Student Exchange</span>
          </div>

          {/* Emphasized Headline matching image */}
          <h1 className="hero-main-title">
            Your Campus Ecosystem for{' '}
            <span className="highlight-tag cyan">Buying</span>,
            <br />
            <span className="highlight-tag indigo">Selling &amp; Renting.</span>
          </h1>

          <p className="hero-main-desc">
            Find affordable semester textbooks, borrow lab gear, buy a campus cycle, or recover lost essentials within PICT.
          </p>

          {/* Trending Searches Row */}
          <div className="trending-searches-row">
            <span className="trending-label">TRENDING SEARCHES:</span>
            <div className="trending-tags-wrap">
              {TRENDING_KEYWORDS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="trending-tag-pill"
                  onClick={() => navigate('/orderhome')}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ── 4. 4 Interactive Quick Access Cards in a Row ── */}
          <div className="quick-services-grid">
            {/* 1. Buy & Sell */}
            <div
              className="quick-service-card"
              onClick={() => navigate('/orderhome')}
              role="button"
              tabIndex={0}
            >
              <div className="card-top-row">
                <div className="service-icon-box purple-tint">
                  <span>🏬</span>
                </div>
                <span className="card-arrow-icon">→</span>
              </div>
              <h3 className="service-card-title">Buy &amp; Sell</h3>
              <p className="service-card-desc">
                85+ active student listings (Textbooks, Electronics, Hostels essentials)
              </p>
              <div className="service-status-pill green">
                <span className="status-dot green" />
                Active Trading Quad
              </div>
            </div>

            {/* 2. Rent Gear */}
            <div
              className="quick-service-card"
              onClick={() => navigate('/rent')}
              role="button"
              tabIndex={0}
            >
              <div className="card-top-row">
                <div className="service-icon-box blue-tint">
                  <span>⏱️</span>
                </div>
                <span className="card-arrow-icon">→</span>
              </div>
              <h3 className="service-card-title">Rent Gear</h3>
              <p className="service-card-desc">
                Calculators, lab coats, drafters, Arduino kits by day or semester
              </p>
              <div className="service-status-pill blue">
                <span className="status-dot blue" />
                Pocket-Friendly Micro-Rentals
              </div>
            </div>

            {/* 3. Lost & Found */}
            <div
              className="quick-service-card"
              onClick={() => navigate('/lostfound')}
              role="button"
              tabIndex={0}
            >
              <div className="card-top-row">
                <div className="service-icon-box amber-tint">
                  <span>🧭</span>
                </div>
                <span className="card-arrow-icon">→</span>
              </div>
              <h3 className="service-card-title">Lost &amp; Found</h3>
              <p className="service-card-desc">
                Active broadcast board: 6 items awaiting claim in library/cafeteria
              </p>
              <div className="service-status-pill amber">
                <span className="status-dot amber" />
                Verified Student Recovery
              </div>
            </div>

            {/* 4. Quick Post (Accent Solid Card) */}
            <div
              className="quick-service-card accent-card"
              onClick={() => handleProtectedAction('list an item in under 60s', 'Quick Post', '📢', '/sell-item')}
              role="button"
              tabIndex={0}
            >
              <div className="card-top-row">
                <div className="service-icon-box white-translucent">
                  <span>📢</span>
                </div>
                <span className="card-arrow-icon white">⊕</span>
              </div>
              <h3 className="service-card-title white">Quick Post</h3>
              <p className="service-card-desc light">
                List an item in under 60 seconds with your student ID
              </p>
              <div className="service-status-pill white-glow">
                <span className="status-dot white" />
                Instant Peer Visibility ⚡
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Category Filter Pills ── */}
      <section className="category-tabs-section">
        <div className="content-container">
          <div className="category-pills-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-scroll-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="pill-emoji">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-filter Bar */}
          <div className="sub-filter-row">
            <div className="segmented-tabs">
              <button
                type="button"
                className={`segment-btn ${listingTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setListingTypeFilter('all')}
              >
                All Listings
              </button>
              <button
                type="button"
                className={`segment-btn ${listingTypeFilter === 'buy' ? 'active' : ''}`}
                onClick={() => {
                  setListingTypeFilter('buy');
                  navigate('/orderhome');
                }}
              >
                Buy Only
              </button>
              <button
                type="button"
                className={`segment-btn ${listingTypeFilter === 'rent' ? 'active' : ''}`}
                onClick={() => {
                  setListingTypeFilter('rent');
                  navigate('/rent');
                }}
              >
                For Rent
              </button>
              <button
                type="button"
                className={`segment-btn ${listingTypeFilter === 'lost' ? 'active' : ''}`}
                onClick={() => {
                  setListingTypeFilter('lost');
                  navigate('/lostfound');
                }}
              >
                Lost &amp; Found
              </button>
            </div>

            <div className="sub-filter-right">
              <span className="verified-items-count">
                Showing <strong>32</strong> verified PICT items
              </span>
              <button type="button" className="sort-dropdown-btn">
                <span>⇅ Recently Posted</span>
                <span className="arrow-down">▾</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Live Campus Marketplace Grid (Image 1) ── */}
      <section className="live-marketplace-section">
        <div className="content-container">
          <div className="section-title-row">
            <div className="title-with-bar">
              <span className="vertical-bar" />
              <h2>Live Campus Marketplace</h2>
            </div>
            <button
              type="button"
              className="link-explore-all"
              onClick={() => navigate('/orderhome')}
            >
              Explore All Items →
            </button>
          </div>

          {/* 4 Cards Grid */}
          <div className="marketplace-cards-grid">
            {LIVE_PRODUCTS.map((prod) => (
              <div key={prod.id} className="campus-product-card">
                {/* Image Container */}
                <div className="product-image-box">
                  <img src={prod.photo} alt={prod.name} className="product-thumb" />
                  <span className="product-discount-badge">{prod.discountBadge}</span>
                  <button type="button" className="wishlist-btn" title="Add to Wishlist">
                    ♡
                  </button>
                  <div className="location-chip">
                    <span>📍 {prod.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="product-body">
                  <span className="condition-pill">{prod.condition}</span>
                  <h4 className="product-name" title={prod.name}>
                    {prod.name}
                  </h4>

                  {/* Price */}
                  <div className="price-row">
                    <span className="current-price">₹{prod.price}</span>
                    {prod.originalPrice && (
                      <span className="strikethrough-price">₹{prod.originalPrice}</span>
                    )}
                    {prod.subtitle && (
                      <span className="price-subtitle">{prod.subtitle}</span>
                    )}
                  </div>

                  {/* Seller Info */}
                  <div className="seller-row">
                    <img src={prod.avatar} alt={prod.seller} className="seller-avatar" />
                    <div className="seller-details">
                      <span className="seller-name">{prod.seller}</span>
                      <span className="seller-branch">{prod.yearBranch}</span>
                    </div>
                    <span className="verified-badge-chip">
                      <span className="shield-tick">🛡️</span> Verified
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="btn-action-ghost"
                      onClick={() => navigate('/orderhome')}
                    >
                      {prod.id === 'prod_1'
                        ? 'Quick Offer'
                        : prod.id === 'prod_2'
                        ? 'Buy Now'
                        : prod.id === 'prod_3'
                        ? 'Inspect'
                        : 'Kit Details'}
                    </button>
                    <button
                      type="button"
                      className="btn-action-chat"
                      onClick={() =>
                        handleProtectedAction(
                          `chat with ${prod.seller}`,
                          'Direct Campus Chat',
                          '💬',
                          '/orderhome'
                        )
                      }
                    >
                      💬 Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Campus Equipment Rentals (Image 2) ── */}
      <section className="rentals-section">
        <div className="content-container">
          <div className="rentals-header-row">
            <div>
              <span className="section-pill-tag">🔄 CAMPUS SHARED ECONOMY</span>
              <h2 className="rentals-title">Campus Equipment Rentals</h2>
              <p className="rentals-subtitle">
                Need it for an exam or project? Don't buy full price — rent from peers with refundable deposits.
              </p>
            </div>
            <button
              type="button"
              className="btn-list-gear"
              onClick={() => handleProtectedAction('list equipment for rent', 'Rent Gear', '🏠', '/rent-item')}
            >
              + List Gear for Rent
            </button>
          </div>

          <div className="rentals-grid">
            {RENT_ITEMS.map((item) => (
              <div key={item.id} className="rental-card">
                <div className="rental-image-box">
                  <img src={item.photo} alt={item.name} className="rental-img" />
                  <span className="rental-pill-badge">{item.badge}</span>
                </div>

                <div className="rental-body">
                  <div className="rental-meta-top">
                    <span className="rental-status-text">{item.status}</span>
                    <span className="rental-deposit-text">{item.deposit}</span>
                  </div>

                  <h4 className="rental-name">{item.name}</h4>
                  <p className="rental-desc">{item.desc}</p>

                  <div className="rental-rates-box">
                    <div className="rate-col">
                      <strong>{item.priceDay}</strong>
                      <span>per day</span>
                    </div>
                    <div className="rate-divider" />
                    <div className="rate-col">
                      <strong>{item.pricePeriod}</strong>
                      <span>extended rate</span>
                    </div>
                  </div>

                  <div className="rental-footer-row">
                    <div className="owner-wrap">
                      <img src={item.avatar} alt={item.owner} className="owner-avatar" />
                      <span className="owner-name">{item.owner}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-reserve-gear"
                      onClick={() =>
                        handleProtectedAction(
                          `reserve ${item.name}`,
                          'Rent Gear',
                          '⏱️',
                          '/rent'
                        )
                      }
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PICT Lost & Found Bulletin (Image 2) ── */}
      <section className="lostfound-bulletin-section">
        <div className="content-container">
          <div className="bulletin-glass-card">
            {/* Bulletin Header */}
            <div className="bulletin-header-row">
              <div className="bulletin-title-wrap">
                <div className="bulletin-icon-box">🔔</div>
                <div>
                  <div className="title-badge-pair">
                    <h3>PICT Lost &amp; Found Bulletin</h3>
                    <span className="active-items-badge">6 Active Items</span>
                  </div>
                  <p className="bulletin-desc">
                    Reported recently across PICT departments. Claim directly or submit found items to security.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-report-lf"
                onClick={() =>
                  handleProtectedAction(
                    'report a lost or found item',
                    'Lost & Found Bulletin',
                    '📢',
                    '/lostfound-item'
                  )
                }
              >
                📢 Report Lost / Found
              </button>
            </div>

            {/* Bulletin Cards */}
            <div className="bulletin-cards-grid">
              {LOST_FOUND_ITEMS.map((item) => (
                <div key={item.id} className="bulletin-card">
                  <div className="bulletin-top-meta">
                    <span className={`bulletin-status-badge ${item.type === 'LOST ITEM' ? 'lost' : 'found'}`}>
                      {item.type}
                    </span>
                    <span className="bulletin-time">{item.time}</span>
                  </div>

                  <h4 className="bulletin-item-title">{item.title}</h4>
                  <p className="bulletin-item-desc">{item.desc}</p>

                  <div className={`bulletin-tag-box ${item.tagType}`}>
                    {item.tag}
                  </div>

                  <div className="bulletin-footer-row">
                    <span className="bulletin-poster-text">{item.reporter}</span>
                    <button
                      type="button"
                      className="btn-bulletin-action"
                      onClick={() => navigate('/lostfound')}
                    >
                      {item.actionText}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Link */}
            <div className="bulletin-bottom-link-wrap">
              <button
                type="button"
                className="btn-view-all-bulletin"
                onClick={() => navigate('/lostfound')}
              >
                View All 14 Lost &amp; Found Reports Across PICT Campus ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Campus Verified Trust Protocol (Image 2) ── */}
      <section className="trust-protocol-section">
        <div className="content-container">
          <div className="trust-glass-card">
            <div className="trust-left-col">
              <span className="trust-protocol-badge">
                🛡️ CAMPUS VERIFIED TRUST PROTOCOL
              </span>
              <h2 className="trust-headline">
                Strictly Peer-to-Peer. Guaranteed Zero Outsiders.
              </h2>
              <p className="trust-body">
                Every profile and transaction on CampusCart PICT is tied directly to verified{' '}
                <code className="email-chip">@pict.edu</code> credentials. Handoffs take place safely
                within designated campus zones (Library Quad, Canteen, Department Foyers).
              </p>

              <div className="trust-checks-row">
                <div className="check-item">
                  <span className="green-circle-check">✓</span>
                  <span>No courier fees or third-party middleman</span>
                </div>
                <div className="check-item">
                  <span className="green-circle-check">✓</span>
                  <span>Hand-to-hand inspection before UPI pay</span>
                </div>
              </div>
            </div>

            <div className="trust-right-col">
              <div className="founders-card">
                <div className="founders-header">
                  <div className="founders-avatars-overlap">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop"
                      alt="Amisha"
                      className="founder-avatar"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80&auto=format&fit=crop"
                      alt="Utkarsh"
                      className="founder-avatar overlap"
                    />
                  </div>
                  <div>
                    <strong>Built by Students, for Students</strong>
                    <span>Amisha P. &amp; Utkarsh S. (PICT Comp '25)</span>
                  </div>
                </div>

                <p className="founders-quote">
                  "Created to save fellow engineers from exorbitant bookstore prices and unmonitored WhatsApp group spam."
                </p>

                <div className="founders-footer-links">
                  <span>♡ Open Source Campus Project</span>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="view-github-link"
                  >
                    View Github
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Multi-Column Footer (Image 2) ── */}
      <footer className="campus-footer">
        <div className="content-container footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-brand-logo">
              <span className="footer-brand-icon">🎓</span>
              <span>CampusCart</span>
            </div>
            <p className="footer-brand-desc">
              The secure, exclusive peer-to-peer campus marketplace designed for students of Pune Institute of Computer Technology.
            </p>
            <p className="footer-made-with">Crafted with pride by PICT Student Developers</p>
          </div>

          {/* Col 2: Marketplace Hub */}
          <div className="footer-links-col">
            <h4>MARKETPLACE HUB</h4>
            <ul>
              <li><button type="button" onClick={() => navigate('/orderhome')}>Textbooks &amp; Academic Notes</button></li>
              <li><button type="button" onClick={() => navigate('/orderhome')}>Electronics &amp; Calculators</button></li>
              <li><button type="button" onClick={() => navigate('/orderhome')}>Hostel &amp; Room Essentials</button></li>
              <li><button type="button" onClick={() => navigate('/rent')}>Lab Coats &amp; Drafting Kits</button></li>
            </ul>
          </div>

          {/* Col 3: Campus Safety */}
          <div className="footer-links-col">
            <h4>CAMPUS SAFETY</h4>
            <ul>
              <li><button type="button" onClick={() => navigate('/')}>Designated Meetup Zones</button></li>
              <li><button type="button" onClick={() => navigate('/profile')}>PICT Student ID Verification</button></li>
              <li><button type="button" onClick={() => navigate('/')}>Escrow &amp; Anti-Fraud Tips</button></li>
              <li><button type="button" onClick={() => navigate('/')}>Community Honor Code</button></li>
            </ul>
          </div>

          {/* Col 4: Student Support */}
          <div className="footer-links-col">
            <h4>STUDENT SUPPORT</h4>
            <ul>
              <li><button type="button" onClick={() => navigate('/lostfound')}>Report Inappropriate Item</button></li>
              <li><button type="button" onClick={() => navigate('/lostfound')}>Lost Item Protocol</button></li>
              <li><button type="button" onClick={() => navigate('/')}>Contact Student Council</button></li>
              <li><button type="button" onClick={() => navigate('/')}>Release Notes &amp; Feedback</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="content-container footer-bottom-inner">
            <span>&copy; 2025 CampusCart PICT. Student Driven Initiative.</span>
            <span>Only accessible to verified @pict.edu domain accounts.</span>
          </div>
        </div>
      </footer>

      {/* ── Login Prompt Modal ── */}
      {showLoginModal && (
        <LoginPromptModal
          serviceName={blockedService.name}
          serviceIcon={blockedService.icon}
          isActionBlocked={!!blockedAction}
          actionText={blockedAction || 'access this service'}
          onClose={() => {
            setShowLoginModal(false);
            setBlockedAction(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;