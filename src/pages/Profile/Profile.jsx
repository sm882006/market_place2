import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
    const { user, token, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [fetchError, setFetchError] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, navigate]);

    // Fetch profile from backend
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
        }
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/');
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
                    <button className="option-btn" onClick={() => navigate('/marketplace')}>
                        🛒 Buy / Sell Products
                    </button>

                    <button className="option-btn" onClick={() => navigate('/rent')}>
                        🏠 Rent Marketplace
                    </button>

                    <button className="option-btn" onClick={() => navigate('/lostfound')}>
                        🔍 Lost & Found
                    </button>
                </div>

                {/* ── Activity History ── */}
                <div className="history">
                    <h2>📋 Your Activity</h2>

                    <div className="history-item">
                        <img
                            src="https://via.placeholder.com/80"
                            alt="Laptop"
                            className="history-image"
                        />
                        <div className="history-info">
                            <h4>Laptop</h4>
                            <p>🛒 Bought</p>
                        </div>
                    </div>

                    <div className="history-item">
                        <img
                            src="https://via.placeholder.com/80"
                            alt="Calculator"
                            className="history-image"
                        />
                        <div className="history-info">
                            <h4>Scientific Calculator</h4>
                            <p>📦 Sold</p>
                        </div>
                    </div>

                    <div className="history-item">
                        <img
                            src="https://via.placeholder.com/80"
                            alt="ID Card"
                            className="history-image"
                        />
                        <div className="history-info">
                            <h4>ID Card</h4>
                            <p>🔍 Lost & Found</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;