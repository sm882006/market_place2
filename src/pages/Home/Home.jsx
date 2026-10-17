import { useEffect, useState } from 'react';
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

const SHOWCASE_ENDPOINTS = {
  marketplace: '/api/products?status=available&sortBy=date_desc&limit=4',
  rentals: '/api/rents?status=available&sortBy=date_desc&limit=4',
  lostfound: '/api/lostfound?status=unclaimed&limit=4',
};

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatShowcaseItem = (record, tab) => {
  const id = record.id || record._id;
  if (tab === 'marketplace') {
    const discount = record.originalPrice > record.price
      ? `${Math.round((1 - record.price / record.originalPrice) * 100)}% OFF`
      : 'FOR SALE';
    return {
      id,
      title: record.name,
      category: record.category || 'Marketplace',
      price: formatPrice(record.price),
      originalPrice: record.originalPrice ? formatPrice(record.originalPrice) : null,
      badge: discount,
      condition: record.condition || 'Available',
      location: record.location || 'PICT Campus',
      owner: record.sellerUsername || 'Student seller',
      photo: record.photo || record.photos?.[0],
      actionText: 'View item',
      target: `/marketplace/${id}`,
    };
  }
  if (tab === 'rentals') {
    return {
      id,
      title: record.name,
      category: record.category || 'Rental',
      price: `${formatPrice(record.rentPerDay)} / day`,
      badge: 'FOR RENT',
      condition: `Deposit: ${formatPrice(record.deposit)}`,
      location: record.location || 'PICT Campus',
      owner: record.ownerUsername || 'Student owner',
      photo: record.photo || record.photos?.[0],
      actionText: 'View rental',
      target: '/rent',
    };
  }
  return {
    id,
    title: record.title || record.name,
    category: record.category || 'Lost & Found',
    price: (record.type || 'found').toUpperCase(),
    badge: record.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM',
    condition: record.description || 'See report for details',
    location: record.location || 'PICT Campus',
    owner: record.reportedByUsername || record.reporterUsername || 'Student reporter',
    photo: record.photo,
    actionText: 'View report',
    target: '/lostfound',
  };
};

const uniqueFirstFour = (records) => {
  const seen = new Set();
  return records.filter((record) => {
    const id = record.id || record._id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, 4);
};
const Home = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchInput, setSearchInput] = useState('');
  const [showcase, setShowcase] = useState({ marketplace: [], rentals: [], lostfound: [] });
  const [showcaseErrors, setShowcaseErrors] = useState({});
  const [showcaseLoading, setShowcaseLoading] = useState(true);
  const [refreshShowcase, setRefreshShowcase] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setShowcaseLoading(true);

    Promise.allSettled(
      Object.entries(SHOWCASE_ENDPOINTS).map(async ([tab, endpoint]) => {
        const response = await fetch(endpoint, { headers, signal: controller.signal });
        if (!response.ok) throw new Error(`Unable to load ${tab}`);
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error(`Invalid ${tab} response`);
        return uniqueFirstFour(records);
      })
    ).then((results) => {
      if (controller.signal.aborted) return;
      const nextShowcase = {};
      const nextErrors = {};
      Object.keys(SHOWCASE_ENDPOINTS).forEach((tab, index) => {
        const result = results[index];
        nextShowcase[tab] = result.status === 'fulfilled' ? result.value : [];
        nextErrors[tab] = result.status === 'rejected';
      });
      setShowcase(nextShowcase);
      setShowcaseErrors(nextErrors);
      setShowcaseLoading(false);
    });

    return () => controller.abort();
  }, [token, refreshShowcase]);

  const visibleItems = showcase[activeTab].map((record) => formatShowcaseItem(record, activeTab));

  // Login prompt modal state for unauthenticated users
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState(null);
  const [modalService, setModalService] = useState({ name: 'Campus Marketplace', icon: '🛍️' });

  // Wishlist state synced with localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campusmart-wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      localStorage.setItem('campusmart-wishlist', JSON.stringify(updated));
      return updated;
    });
  };

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
      navigate(`/marketplace?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/marketplace');
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
                  navigate(`/marketplace?search=${encodeURIComponent(tag)}`);
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
              onClick={() => handleServiceClick('/marketplace', 'Buy & Sell Marketplace', '🛍️')}
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
                  <span className="status-dot green" /> Latest Campus Listings
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
              <p className="showcase-subtitle">Latest listings from the campus marketplace</p>
            </div>

            {/* Glass Segmented Switcher */}
            <div className="glass-tab-switcher">
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
                onClick={() => setActiveTab('marketplace')}
              >
                🛍️ Buy &amp; Sell ({showcaseLoading || showcaseErrors.marketplace ? '…' : showcase.marketplace.length})
              </button>
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                ⏱️ Gear for Rent ({showcaseLoading || showcaseErrors.rentals ? '…' : showcase.rentals.length})
              </button>
              <button
                type="button"
                className={`glass-tab-btn ${activeTab === 'lostfound' ? 'active' : ''}`}
                onClick={() => setActiveTab('lostfound')}
              >
                🧭 Lost &amp; Found ({showcaseLoading || showcaseErrors.lostfound ? '…' : showcase.lostfound.length})
              </button>
            </div>
          </div>

          {/* Cards Grid for Selected Tab */}
          {showcaseLoading ? (
            <div className="showcase-status" role="status">Loading the latest campus listings…</div>
          ) : showcaseErrors[activeTab] ? (
            <div className="showcase-status" role="alert">
              <p>Live listings are temporarily unavailable.</p>
              <button type="button" onClick={() => setRefreshShowcase((count) => count + 1)}>Try again</button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="showcase-status" role="status">No listings in this section yet.</div>
          ) : (
          <div className="showcase-cards-grid">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="showcase-glass-card"
                onClick={() => handleServiceClick(item.target, item.title, '📦')}
              >
                <div className="card-image-wrap">
                  {item.photo ? (
                    <img src={item.photo} alt={item.title} className="card-photo" loading="lazy" />
                  ) : (
                    <div className="card-photo-placeholder" aria-hidden="true">📦</div>
                  )}
                  <span className="card-badge-pill">{item.badge}</span>
                  {activeTab !== 'lostfound' && <button
                    type="button"
                    className={`wishlist-btn ${wishlist.includes(item.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id);
                    }}
                    aria-label={wishlist.includes(item.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={wishlist.includes(item.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {wishlist.includes(item.id) ? '♥' : '♡'}
                  </button>}
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
          )}

          {/* Link to Full Hub */}
          <div className="showcase-bottom-cta">
            <button
              type="button"
              className="btn-explore-full"
              onClick={() => {
                if (activeTab === 'marketplace') navigate('/marketplace');
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
            
            <div>
              <div className="trust-heading">100% Verified PICT Students</div>
              <div className="trust-sub">Only official @pict.edu institutional emails allowed.</div>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-pillar">
            
            <div>
              <div className="trust-heading">Quad &amp; Library Meetups</div>
              <div className="trust-sub">Safe in-person inspection before any UPI payment.</div>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-pillar">
            
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
            <div className="footer-brand-title">⚡ CampusMart PICT</div>
            <p className="footer-brand-sub">
              Built with ❤️ for PICT Pune engineers • Student driven open-source project.
            </p>
          </div>

          <div className="footer-quick-links">
            <button type="button" onClick={() => handleServiceClick('/marketplace', 'Marketplace', '🛍️')}>
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
            © 2026 CampusMart PICT. Student peer exchange.
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
