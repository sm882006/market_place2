import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const API = '';

const Profile = () => {
    const { user, token, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activeSection, setActiveSection] = useState('activity'); // 'activity' | 'notifications' | 'messages'
    const [actionMsg, setActionMsg] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Private Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

    // Private 1-on-1 Chats state
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const messagesEndRef = useRef(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, navigate]);

    // Fetch user activity
    const loadUserActivity = useCallback(async () => {
        if (!token) return;
        try {
            setLoadingActivity(true);
            const res = await fetch(`${API}/api/user/activity`, {
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

    // Fetch private notifications
    const loadNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
                setUnreadNotifsCount(data.filter((n) => !n.isRead).length);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, [token]);

    // Fetch private chat threads
    const loadChats = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setChats(data || []);
            }
        } catch (err) {
            console.error('Error fetching chats:', err);
        }
    }, [token]);

    // Initial loading and polling for logged-in user
    useEffect(() => {
        if (token) {
            fetch(`${API}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.user) {
                        setProfileData(data.user);
                    }
                })
                .catch(() => {});

            loadUserActivity();
            loadNotifications();
            loadChats();

            // Background polling every 10s for private updates
            const timer = setInterval(() => {
                loadNotifications();
                loadChats();
            }, 10000);
            return () => clearInterval(timer);
        }
    }, [token, loadUserActivity, loadNotifications, loadChats]);

    // Load active chat thread messages
    const selectChat = async (chat) => {
        setActiveChat(chat);
        setActiveSection('messages');
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/chats/${chat.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            console.error('Error loading chat:', err);
        }
    };

    // Send private message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatText.trim() || !activeChat || !token) return;
        setSendingMsg(true);
        try {
            const res = await fetch(`${API}/api/chats/${activeChat.id}/message`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: chatText.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, data.msg]);
                setChatText('');
                loadChats();
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            console.error('Message error:', err);
        } finally {
            setSendingMsg(false);
        }
    };

    // Helper to open chat associated with notification or activity
    const handleOpenChatForNotifOrActivity = async (item) => {
        setActiveSection('messages');
        const targetProdId = item.productId || item.rawId;
        const targetRentId = item.rentId || item.rawId;
        
        let match = chats.find(c => (targetProdId && c.productId === targetProdId) || (targetRentId && c.rentId === targetRentId));
        
        if (!match && token) {
            try {
                const res = await fetch(`${API}/api/chats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const freshChats = await res.json();
                    setChats(freshChats || []);
                    match = (freshChats || []).find(c => (targetProdId && c.productId === targetProdId) || (targetRentId && c.rentId === targetRentId));
                    if (!match && freshChats.length > 0) match = freshChats[0];
                }
            } catch (err) {
                console.error('Error refreshing chats:', err);
            }
        }
        
        if (match) {
            selectChat(match);
        }
    };

    // Seller approves sale directly
    const handleApproveSale = async (actOrChat) => {
        const prodId = actOrChat.rawId || actOrChat.productId || actOrChat.rentId || actOrChat.id;
        const isRent = actOrChat.isRent || actOrChat.type === 'rent_request' || actOrChat.type === 'rent_listing' || actOrChat.rentId;
        const defaultEndpoint = isRent ? `/api/rents/${prodId}/approve-rent` : `/api/products/${prodId}/approve-sale`;
        const endpoint = actOrChat.approveEndpoint || defaultEndpoint;
        setProcessingId(prodId);

        try {
            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (res.ok) {
                setActionMsg(isRent ? `✅ Success! You approved the rental request.` : `✅ Success! You approved the sale. Product marked as Sold.`);
                setTimeout(() => setActionMsg(''), 5000);
                loadUserActivity();
                loadNotifications();
                loadChats();
            } else {
                alert(data.message || 'Failed to approve request.');
            }
        } catch (err) {
            alert('Network error while approving.');
        } finally {
            setProcessingId(null);
        }
    };

    // Seller declines request
    const handleDeclineRequest = async (actOrChat) => {
        const prodId = actOrChat.rawId || actOrChat.productId || actOrChat.rentId || actOrChat.id;
        const isRent = actOrChat.isRent || actOrChat.type === 'rent_request' || actOrChat.type === 'rent_listing' || actOrChat.rentId;
        const defaultEndpoint = isRent ? `/api/rents/${prodId}/reject-rent` : `/api/products/${prodId}/reject-sale`;
        const endpoint = actOrChat.rejectEndpoint || defaultEndpoint;
        
        if (!window.confirm(isRent ? 'Decline this rental request? Item will remain available.' : 'Decline this purchase request? The product will remain available.')) return;
        setProcessingId(prodId);

        try {
            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (res.ok) {
                setActionMsg(isRent ? `Rental request declined. Item remains available.` : `Purchase request declined. Product remains available.`);
                setTimeout(() => setActionMsg(''), 4000);
                loadUserActivity();
                loadNotifications();
                loadChats();
            } else {
                alert(data.message || 'Failed to decline request.');
            }
        } catch (err) {
            alert('Network error while declining.');
        } finally {
            setProcessingId(null);
        }
    };

    // Delete listing
    const handleDeleteListing = async (act) => {
        if (!window.confirm(`Are you sure you want to remove "${act.title}"?`)) return;
        const endpoint = act.deleteEndpoint || (act.type === 'sell_listing' ? `/api/products/${act.rawId}` : `/api/rents/${act.rawId}`);
        try {
            const res = await fetch(`${API}${endpoint}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setActionMsg(`Listing "${act.title}" removed.`);
                setTimeout(() => setActionMsg(''), 3500);
                loadUserActivity();
            }
        } catch (err) {
            alert('Failed to remove item.');
        }
    };

    // Mark notification read
    const markNotifRead = async (notifId) => {
        try {
            await fetch(`${API}/api/notifications/${notifId}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
            setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
        } catch (err) {}
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading your profile...</div>
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

    // Activity stats
    const sellCount = activities.filter((a) => a.type === 'sell_listing').length;
    const rentCount = activities.filter((a) => a.type === 'rent_listing').length;
    const orderCount = activities.filter((a) => a.type === 'buy_order' || a.type === 'rent_order').length;
    const pendingCount = activities.filter((a) => a.canApprove || a.type === 'pending_buy' || a.type === 'pending_rent').length;

    // Filtered activity
    const filteredActivities = activities.filter((act) => {
        if (activityFilter === 'all') return true;
        if (activityFilter === 'selling') return act.type === 'sell_listing';
        if (activityFilter === 'renting') return act.type === 'rent_listing';
        if (activityFilter === 'orders') return act.type === 'buy_order' || act.type === 'rent_order';
        if (activityFilter === 'pending') return act.status === 'pending' || act.type === 'pending_buy' || act.type === 'pending_rent';
        if (activityFilter === 'lostfound') return act.type === 'lost_found_report';
        return true;
    });

    return (
        <div className="profile-page">
            {/* ─── Left: Profile Card ─── */}
            <div className="profile-card">
                <div className="profile-avatar">
                    <span className="profile-initials">{initials}</span>
                </div>

                <h2 className="profile-username">{displayUser?.username || 'User'}</h2>
                <p className="profile-email">{displayUser?.email || 'No email'}</p>

                <div className="profile-divider"></div>

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

                {actionMsg && <div className="profile-success-banner">{actionMsg}</div>}

                <button className="profile-logout-btn" onClick={handleLogout}>
                    Log Out
                </button>

                <button className="profile-back" onClick={() => navigate('/')}>
                    ← Back to Home
                </button>
            </div>

            {/* ─── Right Panel: Private Dashboard ─── */}
            <div className="rightpart">
                {/* 3 Quick Navigation Buttons */}
                <div className="options">
    <button className="option-btn" onClick={() => navigate('/marketplace')}>
        <span className="opt-icon">🛒</span>
        <span>Buy &amp; Sell Store</span>
    </button>

    <button className="option-btn" onClick={() => navigate('/rent')}>
        <span className="opt-icon">🏠</span>
        <span>Rent Marketplace</span>
    </button>

    <button className="option-btn" onClick={() => navigate('/lostfound')}>
        <span className="opt-icon">🔍</span>
        <span>Lost &amp; Found</span>
    </button>

    <button className="option-btn" onClick={() => navigate('/wishlist')}>
        <span className="opt-icon">❤️</span>
        <span>My Wishlist</span>
    </button>
</div>

                {/* Private Section Navigation Tabs */}
                <div className="profile-section-nav">
                    <button
                        className={`sec-nav-btn ${activeSection === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveSection('activity')}
                    >
                        📋 Your Activity ({activities.length})
                    </button>

                    <button
                        className={`sec-nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveSection('notifications')}
                    >
                        🔔 Notifications {unreadNotifsCount > 0 && <span className="notif-pill">{unreadNotifsCount} new</span>}
                    </button>

                    <button
                        className={`sec-nav-btn ${activeSection === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveSection('messages')}
                    >
                        💬 Private Messages ({chats.length})
                    </button>
                </div>

                {/* ════════════ SECTION 1: YOUR ACTIVITY ════════════ */}
                {activeSection === 'activity' && (
                    <div className="history">
                        <div className="history-header">
                            <h2>Your Listings &amp; Orders</h2>
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
                            {pendingCount > 0 && (
                                <button
                                    className={`activity-tab ${activityFilter === 'pending' ? 'active' : ''}`}
                                    onClick={() => setActivityFilter('pending')}
                                    style={{ color: '#d97706', fontWeight: '700' }}
                                >
                                    ⏳ Pending Requests ({pendingCount})
                                </button>
                            )}
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
                                <p>You haven't listed or ordered any items in this category yet.</p>
                                <div className="empty-actions">
                                    <button className="cta-btn primary" onClick={() => navigate('/marketplace')}>
                                        + List or Buy Items
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
                                                <span className={`status-badge ${act.status === 'sold' ? 'badge-sold' : act.status === 'pending' ? 'badge-pending' : 'badge-sell'}`}>
                                                    {act.status === 'sold' ? '🏷️' : act.status === 'pending' ? '⏳' : '📦'} {act.statusLabel}
                                                </span>
                                                {act.category && <span className="history-cat">{act.category}</span>}
                                                <span className="history-date">
                                                    {new Date(act.date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {act.details && <p className="history-desc">{act.details}</p>}

                                            {/* Actionable Controls for Seller on Pending Requests */}
                                            {act.canApprove && (
                                                <div className="pending-actions-row">
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => handleApproveSale(act)}
                                                        disabled={processingId === act.rawId}
                                                    >
                                                        {processingId === act.rawId ? 'Processing...' : '✅ Approve & Mark Sold'}
                                                    </button>

                                                    <button
                                                        className="decline-btn"
                                                        onClick={() => handleDeclineRequest(act)}
                                                        disabled={processingId === act.rawId}
                                                    >
                                                        ❌ Decline
                                                    </button>

                                                    <button
                                                        className="chat-action-btn"
                                                        onClick={() => {
                                                            const matchChat = chats.find((c) => c.productId === act.rawId || c.rentId === act.rawId);
                                                            if (matchChat) {
                                                                selectChat(matchChat);
                                                            } else {
                                                                setActiveSection('messages');
                                                            }
                                                        }}
                                                    >
                                                        💬 Private Chat
                                                    </button>
                                                </div>
                                            )}

                                            {/* For Buyer on outgoing pending request */}
                                            {(act.type === 'pending_buy' || act.type === 'pending_rent') && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <button
                                                        className="chat-action-btn"
                                                        onClick={() => {
                                                            const matchChat = chats.find((c) => c.productId === act.rawId || c.rentId === act.rawId);
                                                            if (matchChat) selectChat(matchChat);
                                                            else setActiveSection('messages');
                                                        }}
                                                    >
                                                        💬 Chat with Seller
                                                    </button>
                                                </div>
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
                )}

                {/* ════════════ SECTION 2: PRIVATE NOTIFICATIONS ════════════ */}
                {activeSection === 'notifications' && (
                    <div className="profile-notifs-box">
                        <div className="history-header">
                            <h2>🔔 Your Private Notifications</h2>
                            <span className="activity-count-tag">{notifications.length} total</span>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="empty-activity">
                                <div className="empty-icon">🔔</div>
                                <h3>No notifications</h3>
                                <p>You will receive private notifications when other students request your items or send messages.</p>
                            </div>
                        ) : (
                            <div className="profile-notif-list">
                                {notifications.map((notif) => {
                                    const isBuyRequest = notif.type === 'buy_request';
                                    const isRentRequest = notif.type === 'rent_request';
                                    const isApproved = notif.type.includes('approved');
                                    const isRejected = notif.type.includes('rejected');
                                    const isChat = notif.type === 'chat_message';

                                    return (
                                        <div
                                            key={notif.id}
                                            className={`profile-notif-card ${!notif.isRead ? 'unread' : ''} ${isApproved ? 'notif-approved' : ''} ${isRejected ? 'notif-rejected' : ''}`}
                                            onClick={() => markNotifRead(notif.id)}
                                        >
                                            <div className="notif-card-header">
                                                <div className="notif-header-left">
                                                    <span className={`notif-type-tag ${isBuyRequest ? 'tag-buy' : isRentRequest ? 'tag-rent' : isApproved ? 'tag-approved' : isRejected ? 'tag-rejected' : 'tag-chat'}`}>
                                                        {isBuyRequest ? '📩 Buy Request' : isRentRequest ? '🔑 Rent Request' : isApproved ? '🎉 Request Accepted' : isRejected ? '⚠️ Request Rejected' : '💬 Private Message'}
                                                    </span>
                                                    {notif.requestId && (
                                                        <span className="notif-request-id-badge" title="Unique Request Identifier">
                                                            ID: #{notif.requestId}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="notif-time-tag">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <p className="notif-card-message">{notif.message}</p>

                                            {/* 3 OPTIONS FOR OWNER ON REQUESTS: ACCEPT, REJECT, CHAT */}
                                            {(isBuyRequest || isRentRequest) && (
                                                <div className="notif-quick-actions request-actions-bar" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="approve-btn"
                                                        disabled={processingId === (notif.productId || notif.rentId)}
                                                        onClick={() => handleApproveSale({
                                                            rawId: notif.productId || notif.rentId,
                                                            isRent: isRentRequest,
                                                            approveEndpoint: isBuyRequest ? `/api/products/${notif.productId}/approve-sale` : `/api/rents/${notif.rentId}/approve-rent`
                                                        })}
                                                    >
                                                        ✅ Accept
                                                    </button>
                                                    <button
                                                        className="decline-btn"
                                                        disabled={processingId === (notif.productId || notif.rentId)}
                                                        onClick={() => handleDeclineRequest({
                                                            rawId: notif.productId || notif.rentId,
                                                            isRent: isRentRequest,
                                                            rejectEndpoint: isBuyRequest ? `/api/products/${notif.productId}/reject-sale` : `/api/rents/${notif.rentId}/reject-rent`
                                                        })}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                    <button
                                                        className="chat-action-btn"
                                                        onClick={() => handleOpenChatForNotifOrActivity(notif)}
                                                    >
                                                        💬 Chat
                                                    </button>
                                                </div>
                                            )}

                                            {/* Quick Actions for Approvals / Messages */}
                                            {!isBuyRequest && !isRentRequest && (
                                                <div className="notif-quick-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="chat-action-btn small"
                                                        onClick={() => handleOpenChatForNotifOrActivity(notif)}
                                                    >
                                                        💬 Open Chat
                                                    </button>
                                                    {isApproved && (
                                                        <button
                                                            className="approve-btn small"
                                                            onClick={() => setActiveSection('activity')}>
                                                            📑 View In Orders
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════ SECTION 3: PRIVATE 1-ON-1 CHATS ════════════ */}
                {activeSection === 'messages' && (
                    <div className={`profile-chats-container ${activeChat ? 'has-active-chat' : 'no-active-chat'}`}>
                        {/* Left: Chat Threads List */}
                        <div className="chats-sidebar">
                            <h3 className="chats-sidebar-title">💬 Conversations</h3>
                            {chats.length === 0 ? (
                                <p className="no-chats-msg">No active conversations yet. When someone requests an item, a private chat will appear here.</p>
                            ) : (
                                <div className="chats-threads-list">
                                    {chats.map((chat) => {
                                        const otherPerson = chat.buyerId === user?.id ? chat.sellerUsername : chat.buyerUsername;
                                        const isSelected = activeChat?.id === chat.id;
                                        return (
                                            <div
                                                key={chat.id}
                                                className={`chat-thread-card ${isSelected ? 'active' : ''}`}
                                                onClick={() => selectChat(chat)}
                                            >
                                                <div className="thread-avatar">
                                                    {otherPerson?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="thread-info">
                                                    <div className="thread-top">
                                                        <span className="thread-username">@{otherPerson}</span>
                                                        <span className="thread-badge">{chat.productName || 'Item'}</span>
                                                    </div>
                                                    <div className="thread-last-msg">
                                                        {chat.messages && chat.messages.length > 0
                                                            ? chat.messages[chat.messages.length - 1].text
                                                            : 'Click to start chatting'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right: Active Chat Conversation */}
                        <div className="chats-main-panel">
                            {activeChat ? (
                                <div className="active-chat-box">
                                    <div className="active-chat-header">
                                        <div className="active-chat-header-info">
                                            <button
                                                type="button"
                                                className="chat-back-mobile-btn"
                                                onClick={() => setActiveChat(null)}
                                                title="Back to conversations"
                                            >
                                                ← Back
                                            </button>
                                            <div className="active-chat-header-text">
                                                <h4>
                                                    Chat with @{activeChat.buyerId === user?.id ? activeChat.sellerUsername : activeChat.buyerUsername}
                                                </h4>
                                                <span className="active-item-title">📦 Item: {activeChat.productName}</span>
                                            </div>
                                        </div>

                                        {/* Seller Quick Approve Bar inside Chat */}
                                        {activeChat.sellerId === user?.id && (
                                            <div className="chat-seller-controls">
                                                <button
                                                    className="approve-btn small"
                                                    onClick={() => handleApproveSale({ rawId: activeChat.productId || activeChat.rentId })}
                                                >
                                                    ✅ Approve Sale
                                                </button>
                                                <button
                                                    className="decline-btn small"
                                                    onClick={() => handleDeclineRequest({ rawId: activeChat.productId || activeChat.rentId })}
                                                >
                                                    ❌ Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Messages list */}
                                    <div className="chat-messages-scroll">
                                        {messages.length === 0 ? (
                                            <div className="empty-messages-note">
                                                👋 This is a private 1-on-1 chat between you and @{activeChat.buyerId === user?.id ? activeChat.sellerUsername : activeChat.buyerUsername}.
                                            </div>
                                        ) : (
                                            messages.map((m) => {
                                                const isMe = m.senderId === user?.id;
                                                return (
                                                    <div key={m.id} className={`msg-row ${isMe ? 'me' : 'other'}`}>
                                                        <div className="msg-bubble">
                                                            <div className="msg-sender">@{m.senderUsername}</div>
                                                            <div className="msg-content">{m.text}</div>
                                                            <div className="msg-time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message input */}
                                    <form className="chat-input-bar" onSubmit={handleSendMessage}>
                                        <input
                                            type="text"
                                            placeholder="Type a message (e.g. Can we meet near library at 3 PM?)..."
                                            value={chatText}
                                            onChange={(e) => setChatText(e.target.value)}
                                        />
                                        <button type="submit" disabled={sendingMsg || !chatText.trim()}>
                                            Send
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="no-chat-selected">
                                    <div className="empty-icon">💬</div>
                                    <h3>Select a Conversation</h3>
                                    <p>Click on any thread on the left to read messages and chat directly with the buyer or seller.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
