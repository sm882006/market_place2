import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../../components/LoginPromptModal';
import './Home.css';

const TRENDING_SEARCHES = [
  'Casio fx-991EX',
  'SPPU Sem Books',
  'Hostel Cycle',
  'Drawing Drafter',
  'Arduino Uno',
];

const SHOWCASE_DATA = {
  marketplace: [
    {
      id: 'prod_1',
      title: 'Casio FX-991EX ClassWiz Calculator',
      category: 'Textbooks & Tech',
      price: '₹750',
      originalPrice: '₹1,400',
      badge: '45% OFF',
      condition: 'Like New • 1 Sem Used',
      location: 'F-Building Quad',
      owner: 'Rohan M. (TE IT)',
      photo: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?q=80&w=600&auto=format&fit=crop',
      actionText: 'Quick Offer',
      target: '/orderhome',
    },
    {
      id: 'prod_2',
      title: 'SPPU Core Engineering Books Bundle',
      category: 'Textbooks',
      price: '₹1,100',
      originalPrice: '₹2,200',
      badge: '4 BOOKS BUNDLE',
      condition: 'Good • Clean Notes',
      location: 'Central Library Area',
      owner: 'Sneha K. (BE EnTC)',
      photo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
      actionText: 'Buy Now',
      target: '/orderhome',
    },
    {
      id: 'prod_3',
      title: 'Firefox Mountain Cycle + Lock & Helmet',
      category: 'Mobility',
      price: '₹3,200',
      originalPrice: '₹6,500',
      badge: 'MOVING OUT SALE',
      condition: 'Serviced Last Month',
      location: 'Hostel 2 Parking',
      owner: 'Utkarsh S. (BE Comp)',
      photo: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop',
      actionText: 'Inspect Cycle',
      target: '/orderhome',
    },
    {
      id: 'prod_4',
      title: 'Arduino & IoT Starter Kit (ESP32 + Sensors)',
      category: 'Electronics',
      price: '₹850',
      originalPrice: '₹1,800',
      badge: '52% OFF',
      condition: 'Tested & Working',
      location: 'Lab 304 Quad',
      owner: 'Amey D. (TE Comp)',
      photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
      actionText: 'Kit Details',
      target: '/orderhome',
    },
  ],
  rentals: [
    {
      id: 'rent_1',
      title: 'Omega Engineering Drawing Drafter & Board',
      category: 'Graphics Essential',
      price: '₹30 / day',
      periodPrice: '₹180 / month',
      badge: 'FE MUST-HAVE',
      condition: 'Deposit: ₹300 (Refundable)',
      location: 'Mechanical Dept Foyer',
      owner: 'Priya N. (FE Mech)',
      photo: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=600&auto=format&fit=crop',
      actionText: 'Reserve Gear',
      target: '/rent',
    },
    {
      id: 'rent_2',
      title: 'Raspberry Pi 4 Model B (4GB) + Touchscreen',
      category: 'Capstone Tech',
      price: '₹120 / week',
      periodPrice: '₹400 / month',
      badge: 'READY FOR DEMO',
      condition: 'Deposit: ₹1,000 (Refundable)',
      location: 'Computer Lab 208',
      owner: 'Rahul V. (BE Comp)',
      photo: 'https://images.unsplash.com/photo-1517055729441-db3a4e399b4b?q=80&w=600&auto=format&fit=crop',
      actionText: 'Reserve Pi',
      target: '/rent',
    },
    {
      id: 'rent_3',
      title: 'Clean White Lab Coat & Safety Goggles',
      category: 'Lab Gear',
      price: '₹20 / day',
      periodPrice: '₹75 / practical week',
      badge: 'FRESHLY WASHED',
      condition: 'Deposit: ₹150 (Refundable)',
      location: 'Chemistry Lab Quad',
      owner: 'Ananya P. (FE IT)',
      photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
      actionText: 'Borrow Coat',
      target: '/rent',
    },
  ],
  lostfound: [
    {
      id: 'lf_1',
      title: 'Blue boAt Rockerz Earbuds Case',
      category: 'Lost Item',
      price: 'LOST',
      badge: '₹200 REWARD',
      condition: 'Dropped near Canteen table #4',
      location: 'Main Canteen Area',
      owner: 'Aditya K. (SE IT)',
      photo: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop',
      actionText: 'I Found This',
      target: '/lostfound',
    },
    {
      id: 'lf_2',
      title: 'Silver Titan Metal Analog Watch',
      category: 'Found Item',
      price: 'FOUND',
      badge: 'SAFE IN LAB',
      condition: 'Kept with Lab Attendant Mr. Patil',
      location: 'Computer Lab 208',
      owner: 'Lab 208 Incharge',
      photo: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop',
      actionText: 'Claim Watch',
      target: '/lostfound',
    },
    {
      id: 'lf_3',
      title: 'Data Structures Spiral Handwritten Notes',
      category: 'Found Item',
      price: 'FOUND',
      badge: 'AT CIRCULATION',
      condition: 'Found on 2nd Floor Reading Hall',
      location: 'Central Library Desk',
      owner: 'Tanvi G. (TE Comp)',
      photo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
      actionText: 'Verify Notes',
      target: '/lostfound',
    },
  ],
};

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchInput, setSearchInput] = useState('');

  // Login prompt modal state for unauthenticated users
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState(null);
  const [modalService, setModalService] = useState({ name: 'Campus Marketplace', icon: '🛍️' });

  // Handle service navigation: lands on respective page & prompts login if needed
  const handleServiceClick = (route, serviceName, icon) => {
    if (!isAuthenticated) {
      setBlockedAction(`access ${serviceName}`);
      setModalService({ name: serviceName, icon: icon });
      // Direct navigation to destination page where LoginPromptModal will greet them
      navigate(route);
    } else {
      navigate(route);
    }
  };



  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/orderhome?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/orderhome');
    }
  };

  return (
    <div className="campus-app-wrapper">
      {/* Ambient Blue Glowing Lighting Halo Orbs for Glass Refraction */}
      <div className="ambient-halo-1" />
      <div className="ambient-halo-2" />
      <div className="ambient-halo-3" />

      {/* ── 1. Top Campus Ticker (Translucent Blue Glass) ── */}
      <div className="campus-ticker-glass">
        <span>🎓 Exclusive to verified PICT students • Zero commission peer-to-peer exchange</span>
      </div>



      {/* ── 3. Main Bounded Content Canvas ── */}
      <main className="content-container">
        {/* ── Hero Section (Breathable & Focused) ── */}
        <section className="blue-hero-section">
          <div className="hero-trust-badge">
            <span className="badge-pulse-dot" />
            <span>Pune Institute of Computer Technology • Verified Student Quad</span>
          </div>

          <h1 className="hero-main-heading">
            Your Campus Ecosystem for <br />
            <span className="blue-neon-text">Buying, Selling &amp; Renting.</span>
          </h1>

          <p className="hero-subtext">
            Trade engineering textbooks, borrow semester lab gear, or recover lost belongings
            directly with fellow PICTians at zero platform fees.
          </p>

          {/* Frosted Blue Glass Search Bar */}
          <form className="hero-search-glass" onSubmit={handleSearchSubmit}>
            <div className="search-icon-wrap">
              <span className="search-icon">🔍</span>
            </div>
            <input
              type="text"
              className="search-glass-input"
              placeholder="Search Casio calc, SPPU textbooks, cycle, drafter..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="search-glass-btn">
              Search
            </button>
          </form>

          {/* Trending Pills */}
          <div className="hero-trending-tags">
            <span className="trending-label">TRENDING:</span>
            {TRENDING_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                className="trending-tag-pill"
                onClick={() => {
                  setSearchInput(tag);
                  navigate(`/orderhome?search=${encodeURIComponent(tag)}`);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── 4. The 3 Primary Services (Interactive Blue Glassmorphic Cards) ── */}
        <section className="primary-services-section">
          <div className="section-header-compact">
            <h2 className="section-compact-title">Campus Services</h2>
            <p className="section-compact-desc">
              Choose a hub below to browse listings, borrow gear, or report missing items.
            </p>
          </div>

          <div className="three-services-grid">
            {/* Service 1: Buy & Sell */}
            <div
              className="service-glass-card blue-glow"
              onClick={() => handleServiceClick('/orderhome', 'Buy & Sell Marketplace', '🛍️')}
              role="button"
              tabIndex={0}
            >
              <div className="service-card-header">
                <div className="service-icon-bubble blue-bubble">
                  <span>🛍️</span>
                </div>
                <span className="service-card-arrow">↗</span>
              </div>
              <h3 className="service-title">Buy &amp; Sell</h3>
              <p className="service-desc">
                Engineering textbooks, scientific calculators, hostel cycles, furniture &amp; electronics.
              </p>
              <div className="service-meta-footer">
                <span className="service-status-pill green">
                  <span className="status-dot green" /> 85+ Active Listings
                </span>
                <span className="card-cta-link">Browse Marketplace →</span>
              </div>
            </div>

            {/* Service 2: Rent Gear */}
            <div
              className="service-glass-card cyan-glow"
              onClick={() => handleServiceClick('/rent', 'Campus Rentals', '⏱️')}
              role="button"
              tabIndex={0}
            >
              <div className="service-card-header">
                <div className="service-icon-bubble cyan-bubble">
                  <span>⏱️</span>
                </div>
                <span className="service-card-arrow">↗</span>
              </div>
              <h3 className="service-title">Rent Gear</h3>
              <p className="service-desc">
                Borrow drawing drafters, clean lab coats, Raspberry Pi 4, Arduino kits &amp; components by day or semester.
              </p>
              <div className="service-meta-footer">
                <span className="service-status-pill cyan">
                  <span className="status-dot cyan" /> Pocket-Friendly Micro-Rentals
                </span>
                <span className="card-cta-link">Explore Rentals →</span>
              </div>
            </div>

            {/* Service 3: Lost & Found */}
            <div
              className="service-glass-card purple-glow"
              onClick={() => handleServiceClick('/lostfound', 'Lost & Found Hub', '🧭')}
              role="button"
              tabIndex={0}
            >
              <div className="service-card-header">
                <div className="service-icon-bubble purple-bubble">
                  <span>🧭</span>
                </div>
                <span className="service-card-arrow">↗</span>
              </div>
              <h3 className="service-title">Lost &amp; Found</h3>
              <p className="service-desc">
                Official PICT recovery board. Check library and lab desks or broadcast missing valuables to campus.
              </p>
              <div className="service-meta-footer">
                <span className="service-status-pill purple">
                  <span className="status-dot purple" /> Verified Student Custody
                </span>
                <span className="card-cta-link">Check Bulletin →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Live Campus Showcase (Tabbed, Less Cluttered) ── */}
        <section className="campus-showcase-section">
          <div className="showcase-header-bar">
            <div className="showcase-header-text">
              <h2 className="showcase-title">Live on Campus</h2>
              <p className="showcase-subtitle">Verified peer listings across all PICT departments</p>
            </div>

            {/* Glass Segmented Switcher */}
            <div className="glass-tab-switcher">
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
                onClick={() => setActiveTab('marketplace')}
              >
                🛍️ Buy &amp; Sell ({SHOWCASE_DATA.marketplace.length})
              </button>
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                ⏱️ Gear for Rent ({SHOWCASE_DATA.rentals.length})
              </button>
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'lostfound' ? 'active' : ''}`}
                onClick={() => setActiveTab('lostfound')}
              >
                🧭 Lost &amp; Found ({SHOWCASE_DATA.lostfound.length})
              </button>
            </div>
          </div>

          {/* Cards Grid for Selected Tab */}
          <div className="showcase-cards-grid">
            {SHOWCASE_DATA[activeTab].map((item) => (
              <div
                key={item.id}
                className="showcase-glass-card"
                onClick={() => handleServiceClick(item.target, item.title, '📦')}
              >
                <div className="card-image-wrap">
                  <img src={item.photo} alt={item.title} className="card-photo" loading="lazy" />
                  <span className="card-badge-pill">{item.badge}</span>
                  <div className="card-image-overlay" />
                </div>

                <div className="card-body">
                  <div className="card-top-meta">
                    <span className="card-category">{item.category}</span>
                    <span className="card-location">📍 {item.location}</span>
                  </div>

                  <h4 className="card-item-title">{item.title}</h4>

                  <p className="card-condition-text">{item.condition}</p>

                  <div className="card-price-row">
                    <div className="price-block">
                      <span className="price-main">{item.price}</span>
                      {item.originalPrice && (
                        <span className="price-strike">{item.originalPrice}</span>
                      )}
                      {item.periodPrice && (
                        <span className="price-sub">{item.periodPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-footer-row">
                    <span className="card-owner-text">👤 {item.owner}</span>
                    <button
                      type="button"
                      className="card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(item.target, item.title, '✨');
                      }}
                    >
                      {item.actionText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Link to Full Hub */}
          <div className="showcase-bottom-cta">
            <button
              type="button"
              className="btn-explore-full"
              onClick={() => {
                if (activeTab === 'marketplace') navigate('/orderhome');
                else if (activeTab === 'rentals') navigate('/rent');
                else navigate('/lostfound');
              }}
            >
              Explore All{' '}
              {activeTab === 'marketplace'
                ? 'Marketplace Listings'
                : activeTab === 'rentals'
                ? 'Rental Equipment'
                : 'Lost & Found Reports'}{' '}
              →
            </button>
          </div>
        </section>

        {/* ── 6. Campus Trust Protocol (Minimal 1-Row Glass Strip) ── */}
        <section className="campus-trust-strip">
          <div className="trust-pillar">
            <div className="trust-icon-box">🛡️</div>
            <div>
              <div className="trust-heading">100% Verified PICT Students</div>
              <div className="trust-sub">Only official @pict.edu institutional emails allowed.</div>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-pillar">
            <div className="trust-icon-box">🤝</div>
            <div>
              <div className="trust-heading">Quad &amp; Library Meetups</div>
              <div className="trust-sub">Safe in-person inspection before any UPI payment.</div>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-pillar">
            <div className="trust-icon-box">⚡</div>
            <div>
              <div className="trust-heading">Zero Brokerage Fees</div>
              <div className="trust-sub">100% peer-to-peer student community initiative.</div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 7. Minimal Blue Glass Footer ── */}
      <footer className="blue-glass-footer">
        <div className="footer-content-wrap">
          <div className="footer-brand-side">
            <div className="footer-brand-title">⚡ CampusCart PICT</div>
            <p className="footer-brand-sub">
              Built with ❤️ for PICT Pune engineers • Student driven open-source project.
            </p>
          </div>

          <div className="footer-quick-links">
            <button type="button" onClick={() => handleServiceClick('/orderhome', 'Marketplace', '🛍️')}>
              Marketplace
            </button>
            <span className="dot">•</span>
            <button type="button" onClick={() => handleServiceClick('/rent', 'Rentals', '⏱️')}>
              Rentals
            </button>
            <span className="dot">•</span>
            <button type="button" onClick={() => handleServiceClick('/lostfound', 'Lost & Found', '🧭')}>
              Lost &amp; Found
            </button>
            <span className="dot">•</span>
            <button type="button" onClick={() => navigate('/profile')}>
              Verify ID
            </button>
          </div>

          <div className="footer-copyright">
            © 2026 CampusCart PICT. Student peer exchange.
          </div>
        </div>
      </footer>

      {/* ── Login Prompt Modal (Shown when unauthenticated users trigger actions) ── */}
      {showLoginModal && (
        <LoginPromptModal
          serviceName={modalService.name}
          serviceIcon={modalService.icon}
          isActionBlocked={!!blockedAction}
          actionText={blockedAction || 'continue'}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default Home;