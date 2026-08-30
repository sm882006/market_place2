import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './BuySell.css';

const BuySell = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?status=available');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBuy = async (product) => {
    if (!token) {
      alert('Please log in first to purchase items.');
      navigate('/login');
      return;
    }

    if (user && (product.sellerId === user.id || product.sellerUsername === user.username)) {
      alert('You cannot buy your own listed item!');
      return;
    }

    if (!window.confirm(`Confirm purchase of "${product.name}" for ₹${product.price}?`)) {
      return;
    }

    try {
      setBuyingId(product.id);
      const res = await fetch(`/api/products/${product.id}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contact: user?.email || '' })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(`🎉 Success! Purchased "${product.name}". Check your profile activity!`);
        setTimeout(() => setMsg(''), 5000);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert(data.message || 'Failed to buy product.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing purchase.');
    } finally {
      setBuyingId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !category || p.category.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCategory;
  });

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <div>
          <h1>Buy &amp; Sell Marketplace</h1>
          <p style={{ color: 'rgba(26, 74, 85, 0.7)', fontSize: '0.95rem', margin: '4px 0 0' }}>
            Verified campus listings by PICT students
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sell-btn" onClick={() => navigate('/sell-item')}>
            + Sell Your Item
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

      {msg && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          fontWeight: '600'
        }}>
          {msg}
        </div>
      )}

      <div className="marketplace-controls">
        <input
          type="text"
          placeholder="Search for textbooks, electronics, cycles, lab kits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Electronics">Electronics &amp; Gadgets</option>
          <option value="Books">Books</option>
          <option value="Lab">Lab &amp; Drawing Kits</option>
          <option value="Bicycles">Bicycles &amp; Vehicles</option>
          <option value="Hostel">Hostel &amp; Utilities</option>
          <option value="Others">Others</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#1a4a55', fontWeight: '600' }}>
          Loading live campus listings...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '20px',
          border: '1px dashed rgba(26,74,85,0.2)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
          <h3 style={{ color: '#1a4a55', marginBottom: '8px' }}>No items found</h3>
          <p style={{ color: 'rgba(26,74,85,0.7)', marginBottom: '16px' }}>
            Be the first to list an item in this category or check back later!
          </p>
          <button className="sell-btn" onClick={() => navigate('/sell-item')}>
            + List an Item Now
          </button>
        </div>
      ) : (
        <div className="products">
          {filtered.map((product) => {
            const isMine = user && (product.sellerId === user.id || product.sellerUsername === user.username);
            return (
              <div key={product.id} className="product-card">
                <img
                  src={product.photo || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'}
                  alt={product.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop';
                  }}
                />
                <h3>{product.name}</h3>
                <div className="meta">
                  <span>{product.category}</span>
                  <span>{product.condition || 'Good'}</span>
                </div>
                <p className="price">₹{product.price}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => setSelectedProduct(product)}
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
                      onClick={() => handleBuy(product)}
                      disabled={buyingId === product.id}
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      {buyingId === product.id ? 'Processing...' : '⚡ Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedProduct && (
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
          onClick={() => setSelectedProduct(null)}
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
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>
            <img
              src={selectedProduct.photo || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'}
              alt={selectedProduct.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }}
            />
            <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              {selectedProduct.category}
            </span>
            <h2 style={{ fontSize: '1.4rem', color: '#1a4a55', margin: '10px 0 4px' }}>{selectedProduct.name}</h2>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginBottom: '12px' }}>₹{selectedProduct.price}</div>
            
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '16px' }}>
              {selectedProduct.description || 'No description provided.'}
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              <div>👤 Seller: @{selectedProduct.sellerUsername || selectedProduct.seller}</div>
              <div>📞 Contact: {selectedProduct.contact}</div>
              <div>⏱️ Handover: {selectedProduct.handleTime || 'Immediate'}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
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
                onClick={() => handleBuy(selectedProduct)}
              >
                ⚡ Confirm &amp; Buy (₹{selectedProduct.price})
              </button>
              <a
                href={`tel:${selectedProduct.contact}`}
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
                📞 Call
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuySell;