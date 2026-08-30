import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Rent.css';

const Rent = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [rentDays, setRentDays] = useState(1);
  const [renterContact, setRenterContact] = useState('');
  const [isRenting, setIsRenting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rents?status=available');
      if (res.ok) {
        const data = await res.json();
        setRents(data);
      }
    } catch (err) {
      console.error('Error loading rents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRents();
  }, [fetchRents]);

  const handleRent = async () => {
    if (!selectedItem) return;
    if (!token) {
      alert('Please log in first to rent an item.');
      navigate('/login');
      return;
    }

    if (user && (selectedItem.ownerId === user.id || selectedItem.ownerUsername === user.username)) {
      alert('You cannot rent your own item!');
      return;
    }

    try {
      setIsRenting(true);
      const res = await fetch(`/api/rents/${selectedItem.id}/rent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          days: rentDays,
          contact: renterContact || user?.email || ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`🎉 Success! You have rented "${selectedItem.name}" for ${rentDays} day(s). Check your profile activity!`);
        setTimeout(() => setSuccessMsg(''), 6000);
        setSelectedItem(null);
        fetchRents();
      } else {
        alert(data.message || 'Failed to rent item.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing rental.');
    } finally {
      setIsRenting(false);
    }
  };

  const filtered = rents.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !category || r.category.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCategory;
  });

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <div>
          <h1>🏠 Campus Rent Marketplace</h1>
          <p style={{ color: 'rgba(26, 74, 85, 0.7)', fontSize: '0.95rem', margin: '4px 0 0' }}>
            Rent calculators, lab equipment, cycles, and hostel utilities from peers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sell-btn" onClick={() => navigate('/rent-item')}>
            + Rent Your Product
          </button>
          <button
            className="sell-btn"
            style={{ background: 'rgba(255,255,255,0.6)', color: '#1a4a55', border: '1px solid rgba(255,255,255,0.8)' }}
            onClick={() => navigate('/profile')}
          >
            👤 Profile &amp; Activity
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          fontWeight: '600'
        }}>
          {successMsg}
        </div>
      )}

      <div className="marketplace-controls">
        <input
          type="text"
          placeholder="Search items for rent (e.g. calculator, drafter, cycle)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Lab">Lab &amp; Drawing Kits</option>
          <option value="Electronics">Electronics &amp; Gadgets</option>
          <option value="Bicycles">Bicycles &amp; Vehicles</option>
          <option value="Hostel">Hostel &amp; Utilities</option>
          <option value="Books">Books</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#1a4a55', fontWeight: '600' }}>
          Loading available rental items...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '20px',
          border: '1px dashed rgba(26,74,85,0.2)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
          <h3 style={{ color: '#1a4a55', marginBottom: '8px' }}>No rental items available</h3>
          <p style={{ color: 'rgba(26,74,85,0.7)', marginBottom: '16px' }}>
            Earn money by listing your unused items for rent to other students!
          </p>
          <button className="sell-btn" onClick={() => navigate('/rent-item')}>
            + List Item for Rent
          </button>
        </div>
      ) : (
        <div className="products">
          {filtered.map((item) => {
            const isMine = user && (item.ownerId === user.id || item.ownerUsername === user.username);
            return (
              <div key={item.id} className="product-card">
                <img
                  src={item.photo || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop'}
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop';
                  }}
                />
                <h3>{item.name}</h3>
                <div className="meta">
                  <span>{item.category}</span>
                  <span>{item.condition || 'Good'}</span>
                </div>
                <p className="price">₹{item.rentPerDay} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(26,74,85,0.6)' }}>/ day</span></p>
                <div style={{ fontSize: '0.8rem', color: 'rgba(26,74,85,0.65)', marginBottom: '12px' }}>
                  Deposit: ₹{item.deposit || 0}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setRentDays(1);
                    }}
                    style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                  >
                    View Details
                  </button>
                  {isMine ? (
                    <button onClick={() => navigate('/profile')} style={{ background: '#6366f1' }}>
                      👤 Your Listing (View)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setRentDays(1);
                      }}
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      🤝 Rent Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rent & Details Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: '#f1f5f9',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
              onClick={() => setSelectedItem(null)}
            >
              ×
            </button>
            <img
              src={selectedItem.photo || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop'}
              alt={selectedItem.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }}
            />
            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              {selectedItem.category}
            </span>
            <h2 style={{ fontSize: '1.4rem', color: '#1a4a55', margin: '10px 0 4px' }}>{selectedItem.name}</h2>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981', marginBottom: '12px' }}>
              ₹{selectedItem.rentPerDay} / day <span style={{ fontSize: '0.9rem', color: '#64748b' }}>(Deposit: ₹{selectedItem.deposit || 0})</span>
            </div>

            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '16px' }}>
              {selectedItem.description || 'No description provided.'}
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              <div>👤 Owner: @{selectedItem.ownerUsername || 'Student'}</div>
              <div>📞 Contact: {selectedItem.contact}</div>
              <div>📅 Available: {selectedItem.availableFrom} to {selectedItem.availableTill || 'Ongoing'}</div>
            </div>

            {/* Rent Duration Selector */}
            {(!user || (selectedItem.ownerId !== user.id && selectedItem.ownerUsername !== user.username)) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Number of Days:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rentDays}
                    onChange={(e) => setRentDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Total Estimated Cost:
                  </label>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', paddingTop: '6px' }}>
                    ₹{(selectedItem.rentPerDay * rentDays) + (selectedItem.deposit || 0)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              {user && (selectedItem.ownerId === user.id || selectedItem.ownerUsername === user.username) ? (
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#6366f1',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedItem(null);
                    navigate('/profile');
                  }}
                >
                  👤 Manage in Profile
                </button>
              ) : (
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  onClick={handleRent}
                  disabled={isRenting}
                >
                  {isRenting ? 'Processing...' : `Confirm & Rent (₹${(selectedItem.rentPerDay * rentDays) + (selectedItem.deposit || 0)})`}
                </button>
              )}
              <a
                href={`tel:${selectedItem.contact}`}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                📞 Call Owner
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
