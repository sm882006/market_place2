import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
    const { user, token, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [activityFilter, setActivityFilter] = useState('all');
    const [fetchError, setFetchError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, navigate]);

    // Fetch profile and activity from backend
    const loadUserActivity = useCallback(async () => {
        if (!token) return;
        try {
            setLoadingActivity(true);
            const res = await fetch('/api/user/activity', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
            }
        } catch (err) {
            console.error('Error fetching activity:', err);
        } finally {
            setLoadingActivity(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.user) {
                        setProfileData(data.user);
                    }
                })
                .catch(() => setFetchError('Failed to load profile'));

            loadUserActivity();
        }
    }, [token, loadUserActivity]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Delete an active listing
    const handleDeleteListing = async (act) => {
        if (!window.confirm(`Are you sure you want to remove "${act.title}"?`)) {
            return;
        }

        let endpoint = '';
        if (act.type === 'sell_listing') {
            endpoint = `/api/products/${act.rawId}`;
        } else if (act.type === 'rent_listing') {
            endpoint = `/api/rents/${act.rawId}`;
        } else if (act.type === 'lost_found_report') {
            endpoint = `/api/lostfound/${act.rawId}`;
        }

        if (!endpoint) return;

        try {
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setActionMsg(`Listing "${act.title}" removed.`);
                setTimeout(() => setActionMsg(''), 3500);
                loadUserActivity();
            } else {
                const errData = await res.json();
                alert(errData.message || 'Failed to remove listing.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to remove item.');
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading...</div>
            </div>
        );
    }

    const displayUser = profileData || user;
    const memberSince = displayUser?.createdAt
        ? new Date(displayUser.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'Today';

    const initials = displayUser?.username
        ? displayUser.username.slice(0, 2).toUpperCase()
        : '??';

    // Activity filtering logic
    const filteredActivities = activities.filter((act) => {
        if (activityFilter === 'all') return true;
        if (activityFilter === 'selling') return act.type === 'sell_listing';
        if (activityFilter === 'renting') return act.type === 'rent_listing';
        if (activityFilter === 'orders') return act.type === 'buy_order' || act.type === 'rent_order';
        if (activityFilter === 'lostfound') return act.type === 'lost_found_report';
        return true;
    });

    // Counts for stats
    const sellCount = activities.filter((a) => a.type === 'sell_listing').length;
    const rentCount = activities.filter((a) => a.type === 'rent_listing').length;
    const orderCount = activities.filter((a) => a.type === 'buy_order' || a.type === 'rent_order').length;

    // Helper for type badges
    const getBadgeStyle = (act) => {
        switch (act.type) {
            case 'sell_listing':
                return act.status === 'sold' ? 'badge-sold' : 'badge-sell';
            case 'rent_listing':
                return act.status === 'rented' ? 'badge-rented' : 'badge-rent';
            case 'buy_order':
                return 'badge-buy';
            case 'rent_order':
                return 'badge-rent-order';
            case 'lost_found_report':
                return act.status === 'claimed' ? 'badge-claimed' : 'badge-lostfound';
            default:
                return 'badge-general';
        }
    };

    const getTypeIcon = (act) => {
        switch (act.type) {
            case 'sell_listing':
                return act.status === 'sold' ? '🏷️' : '📦';
            case 'rent_listing':
                return act.status === 'rented' ? '🔑' : '🏠';
            case 'buy_order':
                return '🛒';
            case 'rent_order':
                return '🤝';
            case 'lost_found_report':
                return '🔍';
            default:
                return '📄';
        }
    };

    return (
        <div className="profile-page">
            {/* ─── Left: Profile Card ─── */}
            <div className="profile-card">
                {/* Avatar */}
                <div className="profile-avatar">
                    <span className="profile-initials">{initials}</span>
                </div>

                {/* User Info */}
                <h2 className="profile-username">{displayUser?.username || 'User'}</h2>
                <p className="profile-email">{displayUser?.email || 'No email'}</p>

                {/* Divider */}
                <div className="profile-divider"></div>

                {/* Stats Summary */}
                <div className="profile-stats-grid">
                    <div className="profile-stat-box">
                        <span className="stat-num">{sellCount}</span>
                        <span className="stat-label">Selling</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="stat-num">{rentCount}</span>
                        <span className="stat-label">Rentals</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="stat-num">{orderCount}</span>
                        <span className="stat-label">Orders</span>
                    </div>
                </div>

                {/* Details */}
                <div className="profile-details">
                    <div className="profile-detail-row">
                        <span className="detail-icon">👤</span>
                        <div className="detail-content">
                            <span className="detail-label">Username</span>
                            <span className="detail-value">{displayUser?.username}</span>
                        </div>
                    </div>

                    <div className="profile-detail-row">
                        <span className="detail-icon">📧</span>
                        <div className="detail-content">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{displayUser?.email}</span>
                        </div>
                    </div>

                    <div className="profile-detail-row">
                        <span className="detail-icon">📅</span>
                        <div className="detail-content">
                            <span className="detail-label">Member Since</span>
                            <span className="detail-value">{memberSince}</span>
                        </div>
                    </div>
                </div>

                {fetchError && <p className="profile-error">{fetchError}</p>}
                {actionMsg && <p className="profile-success">{actionMsg}</p>}

                {/* Logout Button */}
                <button className="profile-logout-btn" onClick={handleLogout}>
                    Log Out
                </button>

                {/* Back to Home */}
                <button className="profile-back" onClick={() => navigate('/')}>
                    ← Back to Home
                </button>
            </div>

            {/* ─── Right Panel ─── */}
            <div className="rightpart">
                {/* ── 3 Quick Action Buttons ── */}
                <div className="options">
                    <button className="option-btn" onClick={() => navigate('/orderhome')}>
                        <span className="opt-icon">🛒</span>
                        <span>Buy & Sell Items</span>
                    </button>

                    <button className="option-btn" onClick={() => navigate('/rent')}>
                        <span className="opt-icon">🏠</span>
                        <span>Rent Marketplace</span>
                    </button>

                    <button className="option-btn" onClick={() => navigate('/lostfound')}>
                        <span className="opt-icon">🔍</span>
                        <span>Lost & Found</span>
                    </button>
                </div>

                {/* ── Activity History ── */}
                <div className="history">
                    <div className="history-header">
                        <h2>📋 Your Activity</h2>
                        <span className="activity-count-tag">{filteredActivities.length} items</span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="activity-tabs">
                        <button
                            className={`activity-tab ${activityFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActivityFilter('all')}
                        >
                            All ({activities.length})
                        </button>
                        <button
                            className={`activity-tab ${activityFilter === 'selling' ? 'active' : ''}`}
                            onClick={() => setActivityFilter('selling')}
                        >
                            Selling ({sellCount})
                        </button>
                        <button
                            className={`activity-tab ${activityFilter === 'renting' ? 'active' : ''}`}
                            onClick={() => setActivityFilter('renting')}
                        >
                            Renting ({rentCount})
                        </button>
                        <button
                            className={`activity-tab ${activityFilter === 'orders' ? 'active' : ''}`}
                            onClick={() => setActivityFilter('orders')}
                        >
                            Orders ({orderCount})
                        </button>
                        <button
                            className={`activity-tab ${activityFilter === 'lostfound' ? 'active' : ''}`}
                            onClick={() => setActivityFilter('lostfound')}
                        >
                            Lost & Found
                        </button>
                    </div>

                    {loadingActivity ? (
                        <div className="activity-loading">
                            <div className="spinner-sm"></div>
                            <span>Loading your personal activity...</span>
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="empty-activity">
                            <div className="empty-icon">📭</div>
                            <h3>No activity found</h3>
                            <p>
                                {activityFilter === 'all'
                                    ? "You haven't listed or bought any items yet. Start by exploring campus deals!"
                                    : `You have no ${activityFilter} activity recorded yet.`}
                            </p>
                            <div className="empty-actions">
                                <button className="cta-btn primary" onClick={() => navigate('/orderhome')}>
                                    + List or Buy Items
                                </button>
                                <button className="cta-btn secondary" onClick={() => navigate('/rent-item')}>
                                    + Rent Out Items
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="history-list">
                            {filteredActivities.map((act) => (
                                <div key={act.id} className="history-item">
                                    <img
                                        src={
                                            act.photo ||
                                            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'
                                        }
                                        alt={act.title}
                                        className="history-image"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src =
                                                'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop';
                                        }}
                                    />
                                    <div className="history-info">
                                        <div className="history-top-row">
                                            <h4>{act.title}</h4>
                                            {act.price !== undefined && act.price !== null && (
                                                <span className="history-price">
                                                    ₹{act.price}
                                                    {act.priceUnit || ''}
                                                </span>
                                            )}
                                        </div>

                                        <div className="history-mid-row">
                                            <span className={`status-badge ${getBadgeStyle(act)}`}>
                                                {getTypeIcon(act)} {act.statusLabel}
                                            </span>
                                            {act.category && (
                                                <span className="history-cat">{act.category}</span>
                                            )}
                                            <span className="history-date">
                                                {new Date(act.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>

                                        {act.details && (
                                            <p className="history-desc">{act.details}</p>
                                        )}
                                    </div>

                                    {act.canDelete && (
                                        <button
                                            className="delete-activity-btn"
                                            title="Delete listing"
                                            onClick={() => handleDeleteListing(act)}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;