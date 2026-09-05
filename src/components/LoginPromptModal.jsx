import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPromptModal.css';

const LoginPromptModal = ({
  serviceName = 'Campus Marketplace',
  serviceIcon = '✨',
  onClose,
  isActionBlocked = false,
  actionText = 'access this feature'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [closing, setClosing] = useState(false);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  };

  const handleLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  const handleSignup = () => {
    navigate('/sign', { state: { from: location.pathname } });
  };

  return (
    <div className={`login-modal-overlay ${closing ? 'closing' : ''}`} onClick={!isActionBlocked ? handleDismiss : undefined}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {!isActionBlocked && (
          <button className="login-modal-close" onClick={handleDismiss} aria-label="Close modal">
            ✕
          </button>
        )}

        <div className="login-modal-icon-wrap">
          <span className="service-icon">{serviceIcon}</span>
          <span className="lock-badge">🔐</span>
        </div>

        <h3 className="login-modal-title">
          {isActionBlocked ? 'Sign In Required' : `Welcome to ${serviceName}`}
        </h3>

        <p className="login-modal-desc">
          {isActionBlocked
            ? `Please sign in to your PICT campus account to ${actionText}.`
            : `You're exploring ${serviceName}. Log in to view full contact info, request items, or publish campus listings.`}
        </p>

        <div className="login-modal-actions">
          <button type="button" className="login-modal-btn primary" onClick={handleLogin}>
            Log In to Continue
          </button>

          <button type="button" className="login-modal-btn secondary" onClick={handleSignup}>
            Create Free Account
          </button>

          {!isActionBlocked && (
            <button type="button" className="login-modal-btn text-link" onClick={handleDismiss}>
              Preview items first as guest →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
