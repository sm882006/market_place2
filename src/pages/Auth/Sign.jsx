import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sign.css';

const Sign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, verifySignupOtp } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [notice, setNotice] = useState('');

  const from = location.state?.from || '/profile';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await signup(formData.username, formData.email, formData.password);
      setPendingEmail(data.email);
      setNotice(data.message);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setIsLoading(true);
    try {
      await verifySignupOtp(pendingEmail, otp.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setIsLoading(true);
    try {
      const data = await signup(formData.username, formData.email, formData.password);
      setOtp('');
      setNotice(data.message);
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          type="button"
          className="auth-back-btn"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        <div className="auth-header">
          <span className="auth-brand-badge">🏛️ MarketPICT</span>
          <h2>{pendingEmail ? 'Verify your email' : 'Create your account'}</h2>
          <p>{pendingEmail ? `Enter the code sent to ${pendingEmail}` : 'Join the student marketplace at PICT Pune'}</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}
        {notice && <div className="auth-success-banner" role="status">{notice}</div>}

        {pendingEmail ? (
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-field">
              <label htmlFor="signup-otp">6-digit email code</label>
              <input
                id="signup-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify and create account'}
            </button>
            <button type="button" className="auth-text-btn" onClick={handleResend} disabled={isLoading}>Resend code</button>
            <button type="button" className="auth-text-btn" onClick={() => { setPendingEmail(''); setOtp(''); setNotice(''); setError(''); }} disabled={isLoading}>Change details</button>
          </form>
        ) : <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="e.g. aditi_k"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Campus / Personal Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g. student@pict.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <span
              className="auth-link"
              onClick={() => navigate('/login', { state: { from } })}
            >
              Sign in
            </span>
          </p>
        </form>}
      </div>
    </div>
  );
};

export default Sign;
