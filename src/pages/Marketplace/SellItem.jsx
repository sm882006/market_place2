import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SellItem.css';

const SellItem = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    category: 'Electronics & Gadgets',
    originalPrice: '',
    price: '',
    condition: 'Like New',
    handleTime: 'Immediate handover',
    contact: '',
    description: '',
    photo: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be smaller than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in first to sell an item.');
      navigate('/login');
      return;
    }

    if (!form.name || !form.price || !form.contact) {
      setError('Please fill in all required fields (Name, Selling Price, Contact).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        alert('🎉 Item listed successfully! Your activity has been updated.');
        navigate('/profile');
      } else {
        setError(data.message || 'Failed to list product.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while listing item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
      <div className="sell-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Sell Your Item</h2>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a4a55',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            ← Cancel
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.88rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Casio fx-991EX Calculator"
            required
          />

          <label>Category *</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="Books">Books &amp; Study Material</option>
            <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
            <option value="Lab & Drawing Kits">Lab &amp; Drawing Kits</option>
            <option value="Bicycles & Vehicles">Bicycles &amp; Vehicles</option>
            <option value="Hostel & Daily Utilities">Hostel &amp; Daily Utilities</option>
            <option value="Others">Others</option>
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Original Price (₹)</label>
              <input
                type="number"
                name="originalPrice"
                value={form.originalPrice}
                onChange={handleChange}
                placeholder="When bought"
              />
            </div>
            <div>
              <label>Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Your price"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange}>
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
            <div>
              <label>Handover Time</label>
              <input
                type="text"
                name="handleTime"
                value={form.handleTime}
                onChange={handleChange}
                placeholder="e.g. Immediate, Within 24h"
              />
            </div>
          </div>

          <label>Your Contact Number *</label>
          <input
            type="text"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Write details about the product (semester used, condition, accessories included)..."
            rows="3"
          />

          <label>Product Image</label>

<div className="image-upload-box">
  {!form.photo ? (
    <>
      <div className="upload-icon">📷</div>
      <p>Add Product Image</p>
      <span>JPG, PNG • Max 2MB</span>

      <label className="upload-button">
        Choose Image
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          hidden
        />
      </label>
    </>
  ) : (
    <div className="image-preview">
      <img src={form.photo} alt="Product preview" />

      <p>✓ Image selected</p>

      <label className="upload-button">
        Change Image
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          hidden
        />
      </label>

      <button
        type="button"
        className="remove-image-button"
        onClick={() =>
          setForm((prev) => ({ ...prev, photo: '' }))
        }
      >
        Remove Image
      </button>
    </div>
  )}
</div>

          <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Posting Product...' : 'Post Product Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellItem;
