import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../../components/LoginPromptModal';
import './LostFound.css';

const LostFound = () => {
    const navigate = useNavigate();
    const { token, user, isAuthenticated, loading: authLoading } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [claimingId, setClaimingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Login prompt modal state
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [blockedAction, setBlockedAction] = useState(null);

    // Prompt for login on landing if user is not authenticated
    useEffect(() => {
        if (!authLoading && !token) {
            setShowLoginModal(true);
        }
    }, [authLoading, token]);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/lostfound');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching lost & found:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleClaim = async (item) => {
        if (!token) {
            setBlockedAction('claim this item');
            setShowLoginModal(true);
            return;
        }

        if (!window.confirm(`Mark "${item.name}" as claimed?`)) {
            return;
        }

        try {
            setClaimingId(item.id);
            const res = await fetch(`/api/lostfound/${item.id}/claim`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setSuccessMsg(`🎉 Item "${item.name}" marked as claimed!`);
                setTimeout(() => setSuccessMsg(''), 5000);
                setSelectedItem(null);
                fetchItems();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to claim item.');
            }
        } catch (err) {
            console.error(err);
            alert('Network error while claiming item.');
        } finally {
            setClaimingId(null);
        }
    };

    const filtered = items.filter((item) => {
        const matchSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        const matchLocation = !locationFilter || item.location.toLowerCase().includes(locationFilter.toLowerCase());
        return matchSearch && matchLocation;
    });

    return (
        <div className="lostfound-page">
            <div className="lostfound-header">
                <div>
                    <button
                        type="button"
                        className="back-home-link"
                        onClick={() => navigate('/')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--primary, #4f46e5)',
                            marginBottom: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Home
                    </button>
                    <h1>🔍 Campus Lost &amp; Found</h1>
                    <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.95rem', margin: '4px 0 0' }}>
                        Recover your lost belongings or report items found around PICT campus
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="report-btn"
                        onClick={() => {
                            if (!token) {
                                setBlockedAction('report a found item');
                                setShowLoginModal(true);
                                return;
                            }
                            navigate('/lostfound-item');
                        }}
                    >
                        + Report Found Item
                    </button>
                    <button
                        className="report-btn"
                        style={{ background: '#ffffff', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-subtle, #e2e8f0)', boxShadow: 'var(--shadow-xs)' }}
                        onClick={() => navigate('/profile')}
                    >
                        👤 Profile &amp; Activity
                    </button>
                </div>
            </div>

            {successMsg && (
                <div style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    marginBottom: '20px',
                    fontWeight: '600'
                }}>
                    {successMsg}
                </div>
            )}

            <div className="lostfound-controls">
                <input
                    type="text"
                    placeholder="Search for ID card, keys, bottle, umbrella, earphones..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                    <option value="">All Locations</option>
                    <option value="Library">Library</option>
                    <option value="Main Gate">Main Gate</option>
                    <option value="Cafeteria">Cafeteria / Canteen</option>
                    <option value="Classroom">Classrooms</option>
                    <option value="Hostel">Hostels</option>
                    <option value="Lab">Computer / Electronics Lab</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#1a4a55', fontWeight: '600' }}>
                    Loading lost &amp; found items...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '20px',
                    border: '1px dashed rgba(26,74,85,0.2)'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                    <h3 style={{ color: '#1a4a55', marginBottom: '8px' }}>No items reported</h3>
                    <p style={{ color: 'rgba(26,74,85,0.7)', marginBottom: '16px' }}>
                        Have you found something on campus? Help a peer by reporting it!
                    </p>
                    <button className="report-btn" onClick={() => navigate('/lostfound-item')}>
                        + Report Found Item
                    </button>
                </div>
            ) : (
                <div className="found-items">
                    {filtered.map((item) => (
                        <div key={item.id} className="found-card">
                            <img
                                src={item.photo || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop'}
                                alt={item.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop';
                                }}
                            />
                            <div className="card-body">
                                <h3>{item.name}</h3>
                                <div className="meta">
                                    <div className="meta-item">
                                        <span className="icon">📍</span>
                                        <span>{item.location}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="icon">📅</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                                <span className={`status ${item.status}`}>
                                    {item.status === 'unclaimed' ? '🟡 Unclaimed' : '✅ Claimed'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: '#4f46e5', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Details
                                    </button>
                                    {item.status === 'unclaimed' && (
                                        <button
                                            onClick={() => handleClaim(item)}
                                            disabled={claimingId === item.id}
                                            style={{ flex: 1, padding: '8px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            {claimingId === item.id ? 'Claiming...' : 'Claim'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '16px'
                    }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '24px',
                            maxWidth: '520px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '24px 20px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                            onClick={() => setSelectedItem(null)}
                        >
                            ×
                        </button>
                        <img
                            src={selectedItem.photo || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop'}
                            alt={selectedItem.name}
                            style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }}
                        />
                        <h2 style={{ fontSize: '1.3rem', color: '#1a4a55', margin: '0 0 8px' }}>{selectedItem.name}</h2>
                        
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                            {selectedItem.description || 'No description provided.'}
                        </p>

                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                            <div>📍 Found at: {selectedItem.location}</div>
                            <div>📅 Date: {selectedItem.date}</div>
                            <div>👤 Reported by: @{selectedItem.reportedByUsername || 'Student'}</div>
                            <div>📞 Contact: {selectedItem.contact}</div>
                            <div>🏷️ Status: {selectedItem.status === 'unclaimed' ? 'Unclaimed' : 'Claimed'}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {selectedItem.status === 'unclaimed' && (
                                <button
                                    style={{
                                        flex: 1,
                                        minWidth: '140px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleClaim(selectedItem)}
                                >
                                    ✅ This is Mine (Claim)
                                </button>
                            )}
                            <a
                                href={`tel:${selectedItem.contact}`}
                                style={{
                                    flex: 1,
                                    minWidth: '120px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#334155',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                📞 Call Reporter
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Login prompt modal upon landing or blocked action */}
            {showLoginModal && (
                <LoginPromptModal
                    serviceName="Lost &amp; Found"
                    serviceIcon="🔍"
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

export default LostFound;