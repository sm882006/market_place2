import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main_page">
      <div className="login_page">
        <form className="container" onSubmit={handleSubmit}>
          <div className="head">Log In</div>
          <p className="text">WELCOME BACK</p>

          {error && <p className="login-error">{error}</p>}

          <div className="inside_container">
            <p className="ask">USERNAME</p>
            <input
              type="text"
              name="username"
              placeholder="Enter Your Username"
              className="field-input"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <p className="ask">PASSWORD</p>
            <input
              type="password"
              name="password"
              placeholder="Enter Your Password"
              className="field-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
            <p className="not_login">
              Don't have account?{' '}
              <span onClick={() => navigate('/sign')} style={{ cursor: 'pointer', color: '#8b5cf6' }}>
                Sign up
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
