import React, { useEffect, useState, useRef } from 'react'
import './Home.css'
import { useNavigate } from 'react-router-dom'

const NAV_LINKS = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'footer', label: 'Contact' },
]

const SERVICES = [
    {
        icon: '🛒',
        title: 'Buy & Sell',
        desc: 'List your unused items and find great deals from fellow PICT students – from textbooks to electronics.',
        color: '#6366f1',
    },
    {
        icon: '🏠',
        title: 'Rent Marketplace',
        desc: 'Rent calculators, lab equipment, cycles, or hostel appliances for a short period – save money and space.',
        color: '#10b981',
    },
    {
        icon: '🔍',
        title: 'Lost & Found',
        desc: 'Post or browse found items like ID cards, wallets, keys, and headphones – recover what’s yours quickly.',
        color: '#f59e0b',
    },
]

const FEATURED_ITEMS = [
    {
        title: 'Calculus Volume II',
        category: 'Buy & Sell',
        price: '₹250',
        author: 'Yash M. (SE)',
        emoji: '📚',
        tag: 'Like New',
    },
    {
        title: 'Scientific Calculator FX-991EX',
        category: 'Rent',
        price: '₹20/day',
        author: 'Aditi K. (TE)',
        emoji: '🧮',
        tag: 'Available Now',
    },
    {
        title: 'Lost – Black Wallet',
        category: 'Lost & Found',
        price: 'Found at Library',
        author: 'Rahul P. (BE)',
        emoji: '👛',
        tag: 'Unclaimed',
    },
]

const TESTIMONIALS = [
    {
        quote: 'Sold my old books within a day and rented a calculator for the semester – MarketPICT is a lifesaver!',
        author: 'Priya S.',
        year: 'SE',
        rating: 5,
    },
    {
        quote: 'I lost my ID card and someone posted it on Lost & Found within hours. Thank you, MarketPICT!',
        author: 'Aarav J.',
        year: 'TE',
        rating: 5,
    },
    {
        quote: 'Renting a cycle for the month was so easy and cheap. No more buying things I only need temporarily.',
        author: 'Neha K.',
        year: 'BE',
        rating: 5,
    },
]

const Home = () => {
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeSection, setActiveSection] = useState('home')
    const [statsVisible, setStatsVisible] = useState(false)
    const statsRef = useRef(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const reveals = document.querySelectorAll('.reveal')
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        )
        reveals.forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean)
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting)
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id)
                }
            },
            { threshold: 0.35, rootMargin: '-20% 0px -55% 0px' }
        )
        sections.forEach((s) => observer.observe(s))
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setStatsVisible(true)
                    }
                })
            },
            { threshold: 0.3 }
        )
        if (statsRef.current) observer.observe(statsRef.current)
        return () => observer.disconnect()
    }, [])

    const scrollTo = (id) => {
        setMenuOpen(false)
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="home-page">
            {/* ── Animated Background ── */}
            <div className="bg-orbs-container" aria-hidden="true">
                <div className="bg-orb bg-orb--1" />
                <div className="bg-orb bg-orb--2" />
                <div className="bg-orb bg-orb--3" />
                <div className="bg-orb bg-orb--4" />
                <div className="bg-grid" />
            </div>

            {/* ── Navbar ── */}
            <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
                <div className="navbar__inner">
                    <button
                        type="button"
                        className="navbar__logo"
                        onClick={() => scrollTo('home')}
                    >
                        <span className="logo-icon">🏛️</span>
                        MarketPICT
                        <span className="logo-dot">.</span>
                    </button>

                    <button
                        type="button"
                        className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className={`navbar__links ${menuOpen ? 'open' : ''}`}>
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
                        <div className="navbar__actions">
                            <button
                                type="button"
                                className="navbar__login"
                                onClick={() => {
                                    setMenuOpen(false)
                                    navigate('/login')
                                }}
                            >
                                Log In
                            </button>
                            <button
                                type="button"
                                className="navbar__signup"
                                onClick={() => {
                                    setMenuOpen(false)
                                    navigate('/sign')
                                }}
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section id="home" className="hero">
                <div className="hero__inner">
                    <div className="hero__content">
                        <div className="hero__badge animate-fade-up">
                            <span className="badge-pulse" />
                            Campus Marketplace
                        </div>
                        <h1 className="hero__title animate-fade-up delay-1">
                            Buy, Rent, or <br /><span>Recover</span>
                        </h1>
                        <p className="hero__subtitle animate-fade-up delay-2">
                            MarketPICT – the all‑in‑one student platform for buying, selling, renting, and finding lost items within the PICT campus community.
                        </p>
                        <div className="hero__actions animate-fade-up delay-3">
                            <button type="button" className="btn-primary" onClick={() => scrollTo('services')}>
                                Explore Services
                                <span className="btn-arrow">→</span>
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => navigate('/sign')}>
                                Get Started
                            </button>
                        </div>
                        <div className="hero__trust animate-fade-up delay-4">
                            <div className="trust-item">
                                <span className="trust-icon">✅</span>
                                <span>500+ Active Students</span>
                            </div>
                            <div className="trust-item">
                                <span className="trust-icon">🛍️</span>
                                <span>1,200+ Items Listed</span>
                            </div>
                            <div className="trust-item">
                                <span className="trust-icon">⭐</span>
                                <span>98% Satisfaction</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero__graphics animate-fade-up delay-3">
                        <div className="floating-card floating-card--1" onClick={() => navigate('/sign')}>
                            <div className="fc-header">
                                <span className="fc-category">📚 Buy & Sell</span>
                                <span className="fc-badge">₹250</span>
                            </div>
                            <h4 className="fc-title">Calculus Volume II</h4>
                            <p className="fc-desc">Perfect condition, used for FE Sem II. Minimal annotations.</p>
                            <div className="fc-footer">
                                <span className="fc-author">
                                    <span className="fc-author-dot" /> Yash M. (SE)
                                </span>
                                <span className="fc-tag">Like New</span>
                            </div>
                        </div>

                        <div className="floating-card floating-card--2" onClick={() => navigate('/login')}>
                            <div className="fc-header">
                                <span className="fc-category">🧮 Rent</span>
                                <span className="fc-badge fc-badge--verified">₹20/day</span>
                            </div>
                            <h4 className="fc-title">Scientific Calculator</h4>
                            <p className="fc-desc">FX-991EX, available for the entire semester. Deposit ₹200.</p>
                            <div className="fc-footer">
                                <span className="fc-author">
                                    <span className="fc-author-dot" /> Aditi K. (TE)
                                </span>
                                <span className="fc-tag">Available Now</span>
                            </div>
                        </div>

                        <div className="floating-card floating-card--3" onClick={() => navigate('/sign')}>
                            <div className="fc-header">
                                <span className="fc-category">👛 Lost & Found</span>
                                <span className="fc-badge">Found</span>
                            </div>
                            <h4 className="fc-title">Black Wallet</h4>
                            <p className="fc-desc">Found near the library entrance. Contains ID card.</p>
                            <div className="fc-footer">
                                <span className="fc-author">
                                    <span className="fc-author-dot" /> Rahul P. (BE)
                                </span>
                                <span className="fc-tag">Unclaimed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hero__scroll-hint">
                    <span>Scroll</span>
                    <div className="hero__scroll-line" />
                </div>
            </section>

            {/* ── Services ── */}
            <section id="services" className="section services">
                <div className="section__inner">
                    <div className="section__header reveal">
                        <span className="section__label">What we offer</span>
                        <h2 className="section__title">Three Services, <span>One Campus</span></h2>
                        <p className="section__desc">
                            Everything you need to trade, rent, and recover within the PICT community.
                        </p>
                    </div>
                    <div className="services__grid">
                        {SERVICES.map((s, i) => (
                            <div
                                key={s.title}
                                className={`service-card reveal delay-${i + 1}`}
                                style={{ '--accent': s.color, cursor: 'pointer' }}
                                onClick={() => navigate(s.path)}
                            >
                                <div className="service-card__icon-container">
                                    <span className="service-card__icon">{s.icon}</span>
                                </div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                                <div className="service-card__glow" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Items ── */}
            <section id="featured" className="section featured">
                <div className="section__inner">
                    <div className="section__header reveal">
                        <span className="section__label">Trending now</span>
                        <h2 className="section__title">Featured <span>Listings</span></h2>
                        <p className="section__desc">
                            What your fellow PICT students are buying, renting, or finding.
                        </p>
                    </div>
                    <div className="featured__grid">
                        {FEATURED_ITEMS.map((item, i) => (
                            <div
                                key={item.title}
                                className={`featured-card reveal delay-${i + 1}`}
                                onClick={() => navigate('/sign')}
                            >
                                <div className="featured-card__emoji">{item.emoji}</div>
                                <div className="featured-card__body">
                                    <span className="featured-card__category">{item.category}</span>
                                    <h4>{item.title}</h4>
                                    <p className="featured-card__condition">{item.tag}</p>
                                    <div className="featured-card__footer">
                                        <span className="featured-card__price">{item.price}</span>
                                        <span className="featured-card__author">{item.author}</span>
                                    </div>
                                </div>
                                <div className="featured-card__shine" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About ── */}
            <section id="about" className="section about">
                <div className="section__inner about__layout">
                    <div className="about__visual reveal" ref={statsRef}>
                        <div className="about__card">
                            <div className="about__stat">
                                <div className="about__stat-icon">🎓</div>
                                <div className="about__stat-text">
                                    <strong className={statsVisible ? 'count-up' : ''}>
                                        500+
                                    </strong>
                                    <span>Active Students</span>
                                </div>
                            </div>
                            <div className="about__stat">
                                <div className="about__stat-icon">🛍️</div>
                                <div className="about__stat-text">
                                    <strong className={statsVisible ? 'count-up' : ''}>
                                        1,200+
                                    </strong>
                                    <span>Items Listed</span>
                                </div>
                            </div>
                            <div className="about__stat">
                                <div className="about__stat-icon">⭐</div>
                                <div className="about__stat-text">
                                    <strong className={statsVisible ? 'count-up' : ''}>
                                        98%
                                    </strong>
                                    <span>Satisfaction Rate</span>
                                </div>
                            </div>
                            <div className="about__stat">
                                <div className="about__stat-icon">🕒</div>
                                <div className="about__stat-text">
                                    <strong className={statsVisible ? 'count-up' : ''}>
                                        24hr
                                    </strong>
                                    <span>Avg. Recovery Time</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="about__text reveal delay-1">
                        <span className="section__label">Who we are</span>
                        <h2 className="section__title">About <span>MarketPICT</span></h2>
                        <p>
                            MarketPICT is a student‑driven ecosystem exclusively for the PICT campus. We combine
                            <strong> Buy & Sell</strong>, <strong>Rent Marketplace</strong>, and
                            <strong> Lost & Found</strong> into one trusted platform.
                        </p>
                        <p>
                            Built by students, for students – we make it easy to save money, reduce waste,
                            and recover lost items without the hassle of general marketplaces.
                        </p>
                        <div className="about__features">
                            <span className="about__feature">✅ Verified Students</span>
                            <span className="about__feature">🔒 Safe Exchanges</span>
                            <span className="about__feature">📍 On‑Campus Only</span>
                        </div>
                        <button type="button" className="btn-primary" onClick={() => navigate('/sign')}>
                            Join the Community
                            <span className="btn-arrow">→</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="section testimonials">
                <div className="section__inner">
                    <div className="section__header reveal">
                        <span className="section__label">What students say</span>
                        <h2 className="section__title">Trusted by <span>PICT</span></h2>
                        <p className="section__desc">
                            Real feedback from students who've used the marketplace.
                        </p>
                    </div>
                    <div className="testimonials__grid">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className={`testimonial-card reveal delay-${i + 1}`}>
                                <div className="testimonial-card__stars">
                                    {'⭐'.repeat(t.rating)}
                                </div>
                                <p className="testimonial-card__quote">"{t.quote}"</p>
                                <div className="testimonial-card__author">
                                    <strong>{t.author}</strong>
                                    <span>{t.year}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="section cta">
                <div className="section__inner cta__inner reveal">
                    <div className="cta__content">
                        <h2>Ready to <span>join</span> the ecosystem?</h2>
                        <p>Start buying, selling, renting, or recovering – all within your campus community.</p>
                        <div className="cta__actions">
                            <button type="button" className="btn-primary" onClick={() => navigate('/sign')}>
                                Create Account
                                <span className="btn-arrow">→</span>
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => navigate('/login')}>
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer id="footer" className="footer">
                <div className="footer__inner reveal">
                    <div className="footer__brand">
                        <span className="footer__logo">🏛️ MarketPICT<span className="logo-dot">.</span></span>
                        <p>The campus ecosystem for buying, renting, and recovering. Built by students, for students.</p>
                        <div className="footer__socials">
                            <a href="https://www.instagram.com/pict.pune/" aria-label="Instagram">📸</a>
                            <a href="https://x.com/PunePict" aria-label="Twitter">🐦</a>
                            <a href="https://www.linkedin.com/school/pune-institute-of-computer-technology/" aria-label="LinkedIn">💼</a>
                            <a href="https://www.youtube.com/@puneinstituteofcomputertec4740" aria-label="YouTube">▶️</a>
                        </div>
                    </div>
                    <div className="footer__links">
                        <h4>Quick Links</h4>
                        {NAV_LINKS.map((link) => (
                            <button
                                key={link.id}
                                type="button"
                                onClick={() => scrollTo(link.id)}
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>
                    <div className="footer__contact">
                        <h4>Contact</h4>
                        <p href="mailto:marketplace@pict.edu">📧 marketplacepict@gmail.com</p>
                        <p className="footer__address">📍 PICT Campus, Pune</p>
                        <p className="footer__hours">🕐 Available 24/7</p>
                    </div>
                </div>
                <div className="footer__bottom">
                    <p>&copy; {new Date().getFullYear()} MarketPICT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default Home