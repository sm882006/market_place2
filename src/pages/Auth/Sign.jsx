import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sign.css';

const Sign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from || '/profile';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError('');
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
      await signup(formData.username, formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
          <h2>Create your account</h2>
          <p>Join the student marketplace at PICT Pune</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
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
        </form>
      </div>
    </div>
  );
};

export default Sign;