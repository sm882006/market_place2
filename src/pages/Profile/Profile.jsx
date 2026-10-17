import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';
import { getSocket } from '../../services/socket';
import './Profile.css';

const API = '';

const Profile = () => {
    const { user, token, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [profileData, setProfileData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activeSection, setActiveSection] = useState('activity'); // 'activity' | 'notifications' | 'messages' | 'reviews'
    const [actionMsg, setActionMsg] = useState('');
    const [processingId, setProcessingId] = useState(null);

    // Reviews state
    const [reviews, setReviews] = useState([]);

    // OTP verification state
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpFeedback, setOtpFeedback] = useState('');

    // Private Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

    // Private 1-on-1 Chats state
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [chatError, setChatError] = useState('');
    const messagesEndRef = useRef(null);
    const activeChatIdRef = useRef(null);
    const activityLoadedRef = useRef(false);

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
            if (!activityLoadedRef.current) setLoadingActivity(true);
            const res = await fetch(`${API}/api/user/activity`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
            }
        } catch (err) {
            console.error('Error fetching activity:', err);
        } finally {
            activityLoadedRef.current = true;
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

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (['activity', 'notifications', 'messages', 'reviews'].includes(tab)) setActiveSection(tab);
    }, [searchParams]);

    // Fetch reviews received
    const loadReviews = useCallback(async () => {
        if (!user?.username) return;
        try {
            const res = await fetch(`${API}/api/reviews/seller/${user.username}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data || []);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    }, [user?.username]);

    // Request Student Verification OTP
    const handleSendOtp = async () => {
        try {
            setOtpLoading(true);
            setOtpFeedback('');
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setOtpFeedback(data.message || 'Check your email for the code.');
            } else {
                setOtpFeedback(data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setOtpFeedback('Network error sending OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode.trim()) return;
        try {
            setOtpLoading(true);
            const res = await fetch(`${API}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ otp: otpCode }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpFeedback(data.message);
                setProfileData((prev) => ({ ...prev, isVerified: true }));
                setOtpSent(false);
                setOtpCode('');
            } else {
                setOtpFeedback(data.message || 'Invalid code.');
            }
        } catch (err) {
            setOtpFeedback('Error verifying OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

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
            loadReviews();

            // Setup real-time Socket.IO events
            const socket = getSocket();
            if (user?.username) {
                socket.emit('join_user', user.username);
            }

            const handleNewNotif = (notif) => {
                setNotifications((prev) => [notif, ...prev]);
                setUnreadNotifsCount((prev) => prev + 1);
            };

            const handleNewMsg = (data) => {
                loadChats();
                if (activeChatIdRef.current === data.chatId && data.message) {
                    setMessages((prev) => prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message]);
                }
            };

            socket.on('new_notification', handleNewNotif);
            socket.on('new_message', handleNewMsg);

            // Background polling fallback every 12s
            const timer = setInterval(() => {
                loadNotifications();
                loadChats();
                loadUserActivity();
            }, 12000);

            const refreshOnFocus = () => {
                loadUserActivity();
                loadNotifications();
                loadChats();
            };
            window.addEventListener('focus', refreshOnFocus);

            return () => {
                clearInterval(timer);
                window.removeEventListener('focus', refreshOnFocus);
                socket.off('new_notification', handleNewNotif);
                socket.off('new_message', handleNewMsg);
            };
        }
    }, [token, user?.username, loadUserActivity, loadNotifications, loadChats, loadReviews]);

    // Load active chat thread messages
    const selectChat = async (chat) => {
        setActiveChat(chat);
        activeChatIdRef.current = chat.id;
        setMessages([]);
        setChatError('');
        setActiveSection('messages');
        navigate(`/profile?tab=messages&chatId=${chat.id}`, { replace: true });
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/chats/${chat.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (activeChatIdRef.current === chat.id) setMessages(data.messages || []);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            console.error('Error loading chat:', err);
        }
    };

    useEffect(() => {
        const chatId = searchParams.get('chatId');
        if (!chatId || !chats.length || activeChatIdRef.current === chatId) return;
        const match = chats.find((chat) => chat.id === chatId);
        if (match) selectChat(match);
    // The URL selects a chat only when its ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, searchParams]);

    useEffect(() => {
        if (!activeChat?.id || !token) return;
        const timer = setInterval(async () => {
            if (document.hidden) return;
            try {
                const res = await fetch(`${API}/api/chats/${activeChat.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });
                if (res.ok && activeChatIdRef.current === activeChat.id) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error('Error refreshing chat:', err);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [activeChat?.id, token]);

    // Send private message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatText.trim() || !activeChat || !token) return;
        setSendingMsg(true);
        setChatError('');
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
                setMessages(data.messages || []);
                setChatText('');
                loadChats();
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const data = await res.json();
                setChatError(data.message || 'Could not send your message.');
            }
        } catch (err) {
            console.error('Message error:', err);
            setChatError('Connection lost. Please try again.');
        } finally {
            setSendingMsg(false);
        }
    };

    // Helper to open chat associated with notification or activity
    const handleOpenChatForNotifOrActivity = async (item) => {
        setActiveSection('messages');
        const targetProdId = item.data?.productId || item.productId || item.rawId;
        const targetRentId = item.data?.rentalId || item.data?.rentId || item.rentId || item.rawId;
        const targetChatId = item.data?.chatId || item.chatId;
        
        let match = chats.find(c => (targetChatId && c.id === String(targetChatId)) || (targetProdId && c.productId === String(targetProdId)) || (targetRentId && c.productId === String(targetRentId)));
        
        if (!match && token) {
            try {
                const res = await fetch(`${API}/api/chats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const freshChats = await res.json();
                    setChats(freshChats || []);
                    match = (freshChats || []).find(c => (targetChatId && c.id === String(targetChatId)) || (targetProdId && c.productId === String(targetProdId)) || (targetRentId && c.productId === String(targetRentId)));
                }
            } catch (err) {
                console.error('Error refreshing chats:', err);
            }
        }
        
        if (match) {
            selectChat(match);
        } else {
            setChatError('Conversation not found for this request.');
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
                setNotifications((prev) => prev.filter((n) => String(n.data?.productId || n.data?.rentalId) !== prodId || !['buy_request', 'rent_request'].includes(n.type)));
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
                setNotifications((prev) => prev.filter((n) => String(n.data?.productId || n.data?.rentalId) !== prodId || !['buy_request', 'rent_request'].includes(n.type)));
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

                {/* Seller Reputation */}
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>SELLER RATING</div>
                    <StarRating value={displayUser?.ratingsAverage || 5.0} count={displayUser?.ratingsCount || 0} size="1rem" />
                </div>

                {/* College Student Verification Badge / OTP */}
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '12px', background: displayUser?.isVerified ? '#ecfdf5' : '#eff6ff', border: displayUser?.isVerified ? '1px solid #a7f3d0' : '1px solid #bfdbfe', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: displayUser?.isVerified ? '#065f46' : '#1e40af' }}>
                        <span>{displayUser?.isVerified ? '✓ Verified Student (PICT)' : '🎓 Unverified Student'}</span>
                    </div>
                    {displayUser?.isVerified ? (
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#047857' }}>
                            Your student identity is verified on campus.
                        </p>
                    ) : (
                        <div style={{ marginTop: '8px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#1e3a8a' }}>
                                {displayUser?.email?.endsWith('@pict.edu')
                                    ? 'Verify your college credentials with a 6-digit code sent to your email.'
                                    : 'A @pict.edu email is required for the student badge.'}
                            </p>
                            {displayUser?.email?.endsWith('@pict.edu') && (!otpSent ? (
                                <button
                                    onClick={handleSendOtp}
                                    disabled={otpLoading}
                                    style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                    {otpLoading ? 'Generating OTP...' : 'Send Verification OTP'}
                                </button>
                            ) : (
                                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="Enter 6-digit OTP"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.85rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="submit"
                                            disabled={otpLoading}
                                            style={{ flex: 1, padding: '6px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                                        >
                                            {otpLoading ? 'Verifying...' : 'Verify OTP'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer' }}
                                        >
                                            Resend
                                        </button>
                                    </div>
                                </form>
                            ))}
                            {otpFeedback && (
                                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#0369a1', fontWeight: 500 }}>
                                    {otpFeedback}
                                </div>
                            )}
                        </div>
                    )}
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
                {/* Quick Navigation Buttons */}
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

                    <button className="option-btn" onClick={() => navigate('/orders')}>
                        <span className="opt-icon">📦</span>
                        <span>Orders &amp; Tracking</span>
                    </button>

                    {(displayUser?.role === 'admin' || displayUser?.username?.toLowerCase() === 'admin') && (
                        <button className="option-btn" onClick={() => navigate('/admin')}>
                            <span className="opt-icon">🛡️</span>
                            <span>Admin Panel</span>
                        </button>
                    )}
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

                    <button
                        className={`sec-nav-btn ${activeSection === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveSection('reviews')}
                    >
                        ⭐ Reviews Received ({reviews.length})
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
                                    const requestItemId = String(notif.data?.productId || notif.data?.rentalId || notif.data?.rentId || notif.productId || notif.rentId || '');
                                    const requestIsPending = activities.some((act) =>
                                        act.rawId === requestItemId && act.canApprove &&
                                        (!notif.data?.requestId || notif.data.requestId === act.requestId)
                                    );

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
                                                    {(notif.data?.requestId || notif.requestId) && (
                                                        <span className="notif-request-id-badge" title="Unique Request Identifier">
                                                            ID: #{notif.data?.requestId || notif.requestId}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="notif-time-tag">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <p className="notif-card-message">{notif.message}</p>

                                            {/* 3 OPTIONS FOR OWNER ON REQUESTS: ACCEPT, REJECT, CHAT */}
                                            {(isBuyRequest || isRentRequest) && requestIsPending && (
                                                <div className="notif-quick-actions request-actions-bar" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="approve-btn"
                                                        disabled={processingId === requestItemId}
                                                        onClick={() => handleApproveSale({
                                                            rawId: requestItemId,
                                                            isRent: isRentRequest,
                                                        })}
                                                    >
                                                        ✅ Accept
                                                    </button>
                                                    <button
                                                        className="decline-btn"
                                                        disabled={processingId === requestItemId}
                                                        onClick={() => handleDeclineRequest({
                                                            rawId: requestItemId,
                                                            isRent: isRentRequest,
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
                                        const otherPerson = chat.participants?.find((name) => name !== user?.username) || 'Student';
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
                                                        <span className="thread-badge">{chat.productTitle || 'Item'}</span>
                                                    </div>
                                                    <div className="thread-last-msg">
                                                        {chat.lastMessage || 'Click to start chatting'}
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
                                                onClick={() => {
                                                    activeChatIdRef.current = null;
                                                    setActiveChat(null);
                                                    navigate('/profile?tab=messages', { replace: true });
                                                }}
                                                title="Back to conversations"
                                            >
                                                ← Back
                                            </button>
                                            <div className="active-chat-header-text">
                                                <h4>
                                                    Chat with @{activeChat.participants?.find((name) => name !== user?.username) || 'Student'}
                                                </h4>
                                                <span className="active-item-title">📦 Item: {activeChat.productTitle || 'Conversation'}</span>
                                            </div>
                                        </div>

                                        {/* Seller Quick Approve Bar inside Chat */}
                                        {activities.some((act) => act.rawId === (activeChat.productId || activeChat.rentId) && act.canApprove) && (
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
                                                👋 This is a private conversation with @{activeChat.participants?.find((name) => name !== user?.username) || 'Student'}.
                                            </div>
                                        ) : (
                                            messages.map((m) => {
                                                const isMe = m.sender === user?.username;
                                                return (
                                                    <div key={m._id || `${m.sender}-${m.timestamp}`} className={`msg-row ${isMe ? 'me' : 'other'}`}>
                                                        <div className="msg-bubble">
                                                            <div className="msg-sender">@{m.sender}</div>
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
                                    {chatError && <p className="chat-error" role="alert">{chatError}</p>}
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

                {/* ════════════ SECTION 4: REVIEWS RECEIVED ════════════ */}
                {activeSection === 'reviews' && (
                    <div className="history" style={{ padding: '24px' }}>
                        <div className="history-header" style={{ marginBottom: '20px' }}>
                            <h2>⭐ Reviews &amp; Ratings Received</h2>
                            <span className="activity-count-tag">{reviews.length} reviews</span>
                        </div>

                        {reviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                <span style={{ fontSize: '2.5rem' }}>⭐</span>
                                <h3 style={{ margin: '12px 0 6px', color: '#1e293b' }}>No reviews yet</h3>
                                <p>Once you complete sales or rentals, buyers can leave 5-star ratings and reviews here!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {reviews.map((r) => (
                                    <div
                                        key={r._id || r.id}
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '14px',
                                            padding: '16px 20px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <strong style={{ color: '#0f172a' }}>@{r.reviewerUsername}</strong>
                                                <StarRating value={r.rating} size="0.9rem" showNumber={false} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                            {r.comment || 'No written feedback provided.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
