import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'featured', label: 'Featured' },
  { id: 'about', label: 'About' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'footer', label: 'Contact' },
];

const SERVICES = [
  {
    id: 'buysell',
    title: 'Buy & Sell',
    tag: 'Direct Peer Trading',
    desc: 'List your pre-loved textbooks, electronics, drawing tools, and hostel gear. Connect directly with peers for quick campus handovers.',
    icon: '🛒',
    color: '#4f46e5',
    path: '/orderhome',
    badge: '1,200+ Listed',
    btnText: 'Explore Buy & Sell',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rent',
    title: 'Rent Marketplace',
    tag: 'Short-Term Utility',
    desc: 'Rent FX-991 calculators, drafters, lab equipment, cycles, and appliances per day or semester. Save money and campus space.',
    icon: '🏠',
    color: '#10b981',
    path: '/rent',
    badge: 'Save up to 80%',
    btnText: 'Browse Rentals',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'lostfound',
    title: 'Lost & Found',
    tag: 'Campus Community Recovery',
    desc: 'Report lost IDs, keys, wallets, or electronics found around PICT classrooms, canteen, and library. Reclaim your valuables fast.',
    icon: '🔍',
    color: '#f59e0b',
    path: '/lostfound',
    badge: '< 24hr Avg Return',
    btnText: 'Search Lost & Found',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
  },
];

const FEATURED_ITEMS = [
  {
    title: 'Calculus Volume II (FE Sem 2)',
    category: 'Buy & Sell',
    price: '₹250',
    originalPrice: '₹650',
    author: 'Yash M. (SE)',
    emoji: '📚',
    tag: 'Like New',
    path: '/orderhome',
  },
  {
    title: 'Scientific Calculator FX-991CW',
    category: 'Rent',
    price: '₹20/day',
    originalPrice: 'Deposit ₹300',
    author: 'Aditi K. (TE)',
    emoji: '🧮',
    tag: 'Available Now',
    path: '/rent',
  },
  {
    title: 'Black Leather Wallet with ID',
    category: 'Lost & Found',
    price: 'Unclaimed',
    originalPrice: 'Library 2nd Floor',
    author: 'Reported by Rahul P.',
    emoji: '👛',
    tag: 'Found Item',
    path: '/lostfound',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Sold my FE semester textbooks within 3 hours and picked up a drawing kit from a senior. So convenient!',
    author: 'Priya S.',
    branch: 'Computer Engineering, SE',
    rating: 5,
  },
  {
    quote: 'Lost my college ID card near the workshop. Found it listed here the very next morning.',
    author: 'Aarav J.',
    branch: 'Information Technology, TE',
    rating: 5,
  },
  {
    quote: 'Renting a bicycle for my first month saved me unnecessary purchase hassle before campus hostel allotment.',
    author: 'Neha K.',
    branch: 'Electronics & Telecomm, BE',
    rating: 5,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleServiceClick = (path) => {
    navigate(path);
  };

  return (
    <div className="home-page">
      {/* ── Navbar ── */}
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          <button type="button" className="navbar__logo" onClick={() => scrollTo('home')}>
            <span className="logo-badge">🏛️</span>
            <span className="logo-text">MarketPICT<span className="logo-dot">.</span></span>
          </button>

          <button
            type="button"
            className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`navbar__menu ${menuOpen ? 'open' : ''}`}>
            <div className="navbar__links">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className={`navbar__link ${activeSection === link.id ? 'active' : ''}`}
                  onClick={() => scrollTo(link.id)}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="navbar__actions">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="btn-profile"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    👤 {user?.username || 'Profile'}
                  </button>
                  <button
                    type="button"
                    className="btn-logout"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/sign');
                    }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="home" className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Exclusive to PICT Pune Students
          </div>

          <h1 className="hero-title">
            Buy, Rent, or Recover. <br />
            <span>Everything in one campus hub.</span>
          </h1>

          <p className="hero-subtitle">
            The minimalist marketplace for verified PICT students. Trade engineering textbooks,
            rent lab kits and equipment, or quickly recover lost belongings.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => scrollTo('services')}
            >
              Explore 3 Services ↓
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => navigate(isAuthenticated ? '/profile' : '/sign')}
            >
              {isAuthenticated ? 'Open Dashboard →' : 'Create Free Account'}
            </button>
          </div>

          {/* Highlights Row */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <strong>500+</strong>
              <span>Verified Students</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <strong>1,200+</strong>
              <span>Items Handed Over</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <strong>₹0</strong>
              <span>Middleman Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Clickable Services ── */}
      <section id="services" className="services-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-pill">Campus Services</span>
            <h2 className="section-title">Three Services, One Community</h2>
            <p className="section-desc">
              Select any service below to explore live listings and connect with peers.
            </p>
          </div>

          <div className="services-grid">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className="service-card"
                onClick={() => handleServiceClick(s.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceClick(s.path);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Navigate to ${s.title}`}
              >
                <div className="service-card-image-wrap">
                  <img src={s.image} alt={s.title} className="service-card-image" loading="lazy" />
                  <div className="service-card-image-overlay" />
                  <span className="service-card-badge">{s.badge}</span>
                  <div className="service-card-icon-bubble">{s.icon}</div>
                </div>

                <div className="service-card-content">
                  <span className="service-card-tag">{s.tag}</span>
                  <h3 className="service-card-title">{s.title}</h3>
                  <p className="service-card-desc">{s.desc}</p>

                  <div className="service-card-footer">
                    <span className="service-card-link">
                      {s.btnText}
                      <span className="arrow-icon">→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section id="featured" className="featured-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-pill">Live Campus Feed</span>
            <h2 className="section-title">Recent Campus Listings</h2>
            <p className="section-desc">
              Check out what students have posted recently across textbooks, rentals, and lost items.
            </p>
          </div>

          <div className="featured-grid">
            {FEATURED_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="featured-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
              >
                <div className="featured-card-top">
                  <span className="featured-emoji">{item.emoji}</span>
                  <span className="featured-category-badge">{item.category}</span>
                </div>

                <h4 className="featured-title">{item.title}</h4>

                <div className="featured-meta">
                  <span className="featured-tag">{item.tag}</span>
                  <span className="featured-author">{item.author}</span>
                </div>

                <div className="featured-footer">
                  <div className="featured-pricing">
                    <span className="featured-price">{item.price}</span>
                    <span className="featured-subprice">{item.originalPrice}</span>
                  </div>
                  <span className="featured-cta">View Item →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="about-section">
        <div className="section-container about-grid">
          <div className="about-text-col">
            <span className="section-pill">Why MarketPICT</span>
            <h2 className="section-title">Built specifically for the PICT community.</h2>
            <p className="about-p">
              General marketplaces are filled with strangers, spam, and complicated delivery logistics.
              MarketPICT is strictly for PICT Pune students, enabling secure in-person exchanges
              between classes, at the library, or near the canteen.
            </p>

            <div className="about-perks">
              <div className="about-perk-item">
                <span className="perk-check">✓</span>
                <div>
                  <strong>Peer Verification</strong>
                  <p>Exchange items with confidence with students from your own campus.</p>
                </div>
              </div>

              <div className="about-perk-item">
                <span className="perk-check">✓</span>
                <div>
                  <strong>Zero Platform Commission</strong>
                  <p>Keep 100% of your sales and avoid shipping charges or fees.</p>
                </div>
              </div>

              <div className="about-perk-item">
                <span className="perk-check">✓</span>
                <div>
                  <strong>Same-Day Handover</strong>
                  <p>Meet on campus inside library, hostel, or reading halls in minutes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-stats-card">
            <h3>Campus Trust Snapshot</h3>
            <div className="stats-metric-grid">
              <div className="metric-box">
                <span className="metric-number">98%</span>
                <span className="metric-label">Positive Handover Rate</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">24h</span>
                <span className="metric-label">Avg. Item Resolution</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">100%</span>
                <span className="metric-label">On-Campus Safety</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">₹0</span>
                <span className="metric-label">Listing Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-pill">Student Voices</span>
            <h2 className="section-title">Trusted by fellow PICTians</h2>
            <p className="section-desc">What students say about buying, renting, and recovering.</p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-stars">{'★'.repeat(t.rating)}</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-footer">
                  <strong>{t.author}</strong>
                  <span>{t.branch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-box">
            <h2>Ready to trade or recover on campus?</h2>
            <p>Join hundreds of students saving money and helping each other every semester.</p>
            <div className="cta-buttons">
              <button
                type="button"
                className="btn-cta-primary"
                onClick={() => navigate(isAuthenticated ? '/profile' : '/sign')}
              >
                {isAuthenticated ? 'Go to Your Profile' : 'Create Free Account'}
              </button>
              <button
                type="button"
                className="btn-cta-secondary"
                onClick={() => scrollTo('services')}
              >
                Browse Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="footer" className="site-footer">
        <div className="section-container footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🏛️ MarketPICT.</span>
            <p>The student ecosystem for buying, renting, and recovering. Built by students, for students.</p>
          </div>

          <div className="footer-links-col">
            <h4>Quick Navigation</h4>
            {NAV_LINKS.map((link) => (
              <button key={link.id} type="button" onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
          </div>

          <div className="footer-links-col">
            <h4>Campus Contact</h4>
            <p>📧 marketplacepict@gmail.com</p>
            <p>📍 PICT Campus, Dhankawadi, Pune</p>
            <p>🕒 Open 24/7 for student listings</p>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="section-container footer-bottom-inner">
            <p>&copy; {new Date().getFullYear()} MarketPICT. All rights reserved.</p>
            <p>Exclusive to Pune Institute of Computer Technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;