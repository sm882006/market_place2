import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RentItem.css';

const RentItem = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: '',
    category: 'Lab & Drawing Kits',
    rentPerDay: '',
    deposit: '',
    availableFrom: new Date().toISOString().split('T')[0],
    availableTill: '',
    condition: 'Good',
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
      alert('Please log in first to list a rental item.');
      navigate('/login');
      return;
    }

    if (!form.name || !form.rentPerDay || !form.contact) {
      setError('Please fill in required fields (Name, Rent Per Day, Contact).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/rents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        alert('🎉 Rental product listed successfully! Your profile activity is updated.');
        navigate('/profile');
      } else {
        setError(data.message || 'Failed to list rental product.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while listing rental product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rent-form-page">
      <div className="rent-form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Rent Your Product</h2>
          <button
            type="button"
            onClick={() => navigate('/rent')}
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
            placeholder="e.g. Engineering Drawing Board & Drafter"
            required
          />

          <label>Category *</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="Lab & Drawing Kits">Lab &amp; Drawing Kits</option>
            <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
            <option value="Bicycles & Vehicles">Bicycles &amp; Vehicles</option>
            <option value="Hostel & Daily Utilities">Hostel &amp; Daily Utilities</option>
            <option value="Books">Books &amp; Study Material</option>
            <option value="Others">Others</option>
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Rent Per Day (₹) *</label>
              <input
                type="number"
                name="rentPerDay"
                value={form.rentPerDay}
                onChange={handleChange}
                placeholder="e.g. 30"
                required
              />
            </div>
            <div>
              <label>Security Deposit (₹)</label>
              <input
                type="number"
                name="deposit"
                value={form.deposit}
                onChange={handleChange}
                placeholder="Refundable deposit"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Available From</label>
              <input
                type="date"
                name="availableFrom"
                value={form.availableFrom}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Available Till (Optional)</label>
              <input
                type="date"
                name="availableTill"
                value={form.availableTill}
                onChange={handleChange}
              />
            </div>
          </div>

          <label>Condition</label>
          <select name="condition" value={form.condition} onChange={handleChange}>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          <label>Your Contact Number *</label>
          <input
            type="text"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            required
          />

          <label>Product Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the condition, parts included, and pickup location..."
            rows="3"
          />

          <label>Product Image</label>
          <input
            type="text"
            name="photo"
            value={form.photo.startsWith('data:') ? '' : form.photo}
            onChange={handleChange}
            placeholder="Paste image URL (optional)"
            style={{ marginBottom: '8px' }}
          />
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Posting Rental Item...' : 'Post Product for Rent'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RentItem;