import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from || '/profile';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
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
          <h2>Welcome back</h2>
          <p>Sign in to your campus account to continue</p>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <span
              className="auth-link"
              onClick={() => navigate('/sign', { state: { from } })}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
