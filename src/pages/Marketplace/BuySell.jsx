import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPromptModal from '../../components/LoginPromptModal';
import './BuySell.css';

const BuySell = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestingId, setRequestingId] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [msg, setMsg] = useState('');
  const [requestSuccessData, setRequestSuccessData] = useState(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState(null);

  const [sortBy, setSortBy] = useState('');
const [maxPrice, setMaxPrice] = useState('');

  

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

  const handleBuyRequest = async (product) => {
    if (!token) {
      setBlockedAction('send a buy request for this item');
      setShowLoginModal(true);
      return;
    }

    if (
      user &&
      (product.sellerId === user.id ||
        product.sellerUsername === user.username)
    ) {
      alert('You cannot request your own listed item!');
      return;
    }

    try {
      setRequestingId(product.id);

      const res = await fetch(
        `/api/products/${product.id}/buy-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message:
              requestNote ||
              `Hi @${product.sellerUsername || 'seller'}, I'm interested in buying your "${product.name}" for ₹${product.price}.`,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setRequestSuccessData({
          requestId: data.requestId,
          chatId: data.chatId,
          productName: product.name,
          sellerUsername:
            product.sellerUsername || product.seller,
        });

        setSelectedProduct(null);
        setRequestNote('');

        setMsg(
          `🎉 Buy Request #${data.requestId} sent to @${
            product.sellerUsername || product.seller
          }!`
        );

        setTimeout(() => setMsg(''), 8000);
        fetchProducts();
      } else {
        alert(data.message || 'Failed to send buy request.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing buy request.');
    } finally {
      setRequestingId(null);
    }
  };

  const [wishlist, setWishlist] = useState(() => {
  return JSON.parse(localStorage.getItem('campusmart-wishlist') || '[]');
});

const toggleWishlist = (productId) => {
  setWishlist((prev) => {
    const updated = prev.includes(productId)
      ? prev.filter((id) => id !== productId)
      : [...prev, productId];

    localStorage.setItem(
      'campusmart-wishlist',
      JSON.stringify(updated)
    );

    return updated;
  });
};

  const filtered = products
  .filter((product) => {
    const searchValue = search.toLowerCase();

    const matchSearch =
      product.name?.toLowerCase().includes(searchValue) ||
      product.description?.toLowerCase().includes(searchValue);

    const matchCategory =
      !category ||
      product.category
        ?.toLowerCase()
        .includes(category.toLowerCase());

    const matchPrice =
      !maxPrice || Number(product.price) <= Number(maxPrice);

    return matchSearch && matchCategory && matchPrice;
  })
  .sort((a, b) => {
    if (sortBy === 'price-low') {
      return Number(a.price) - Number(b.price);
    }

    if (sortBy === 'price-high') {
      return Number(b.price) - Number(a.price);
    }

    if (sortBy === 'newest') {
      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    }

    return 0;
  });

  return (
    <div className="marketplace-page">
      <main className="marketplace-container">

        {/* Header */}
        <section className="marketplace-header">
          <div className="marketplace-heading">
            <button
              type="button"
              className="back-home-link"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>

            <div className="marketplace-title-row">
              <div>
                <span className="marketplace-eyebrow">
                  PICT STUDENT MARKETPLACE
                </span>

                <h1>Buy &amp; Sell</h1>

                <p>
                  Discover useful items listed by verified PICT students.
                </p>
              </div>
            </div>
          </div>

          <div className="marketplace-header-actions">
            <button
              className="btn-primary"
              onClick={() => {
                if (!token) {
                  setBlockedAction('list an item for sale');
                  setShowLoginModal(true);
                  return;
                }

                navigate('/sell-item');
              }}
            >
              + Sell Your Item
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate('/profile')}
            >
              👤 Profile
            </button>
          </div>
        </section>

        {/* Success message */}
        {msg && (
          <div className="success-banner">
            <span>✓</span>
            <span>{msg}</span>
          </div>
        )}

        {/* Search & Filters */}
        <section className="marketplace-toolbar glass-card">
          <div className="marketplace-search">
            <span className="search-symbol">⌕</span>

            <input
              type="text"
              placeholder="Search textbooks, electronics, cycles, lab kits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics &amp; Gadgets</option>
            <option value="Books">Books</option>
            <option value="Lab">Lab &amp; Drawing Kits</option>
            <option value="Bicycles">Bicycles &amp; Vehicles</option>
            <option value="Hostel">Hostel &amp; Utilities</option>
            <option value="Others">Others</option>
          </select>
          <select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="category-select"
>
  <option value="">Sort By</option>
  <option value="newest">Newest</option>
  <option value="price-low">Price: Low to High</option>
  <option value="price-high">Price: High to Low</option>
</select>

<input
  type="number"
  min="0"
  placeholder="Max ₹"
  value={maxPrice}
  onChange={(e) => setMaxPrice(e.target.value)}
  className="price-filter"
/>
        </section>

        {/* Results summary */}
        {!loading && (
          <div className="results-row">
            <div>
              <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'listing' : 'listings'} found
            </div>

            {(search || category || sortBy || maxPrice) && (
              <button
                type="button"
                className="clear-filters"
                onClick={() => {
  setSearch('');
  setCategory('');
  setSortBy('');
  setMaxPrice('');
}}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="marketplace-state glass-card">
            <div className="loading-spinner" />
            <h3>Loading campus listings</h3>
            <p>Finding the latest items from PICT students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="marketplace-state glass-card">
            <div className="empty-icon">📭</div>

            <h3>No items found</h3>

            <p>
              Try changing your search or category, or be the first
              student to list something here.
            </p>

            <button
              className="btn-primary"
              onClick={() => navigate('/sell-item')}
            >
              + List an Item
            </button>
          </div>
        ) : (
          <section className="products">
            {filtered.map((product) => {
              const isMine =
                user &&
                (product.sellerId === user.id ||
                  product.sellerUsername === user.username);

              return (
                <article key={product.id} className="product-card glass-card">

                  {/* Product Image */}
                  <div className="product-image-wrapper">
                    <button
  type="button"
  className={`wishlist-btn ${
    wishlist.includes(product.id) ? 'active' : ''
  }`}
  onClick={() => toggleWishlist(product.id)}
  aria-label={
    wishlist.includes(product.id)
      ? 'Remove from wishlist'
      : 'Add to wishlist'
  }
>
  {wishlist.includes(product.id) ? '♥' : '♡'}
</button>
                    <img
                      src={
                        product.photo ||
                        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop'
                      }
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop';
                      }}
                    />

                    <span className="availability-badge">
                      ● Available
                    </span>
                  </div>

                  {/* Product Information */}
                  <div className="product-content">
                    <div className="product-meta">
                      <span className="category-badge">
                        {product.category}
                      </span>

                      <span className="condition-badge">
                        {product.condition || 'Good'}
                      </span>
                    </div>

                    <h3>{product.name}</h3>

                    <p className="product-description">
                      {product.description ||
                        'No description provided for this listing.'}
                    </p>

                    <div className="product-price">
                      ₹{product.price}
                    </div>

                    <div className="product-actions">
                      <button
                        type="button"
                        className="details-btn"
                        onClick={() => setSelectedProduct(product)}
                      >
                        View Details
                      </button>

                      {isMine ? (
                        <button
                          type="button"
                          className="request-btn own-listing"
                          onClick={() => navigate('/profile')}
                        >
                          👤 Your Listing
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="request-btn"
                          onClick={() => handleBuyRequest(product)}
                          disabled={requestingId === product.id}
                        >
                          {requestingId === product.id
                            ? 'Sending...'
                            : '📩 Request to Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            <img
              src={
                selectedProduct.photo ||
                'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop'
              }
              alt={selectedProduct.name}
              className="modal-product-image"
            />

            <span className="modal-category">
              {selectedProduct.category}
            </span>

            <h2>{selectedProduct.name}</h2>

            <div className="modal-price">
              ₹{selectedProduct.price}
            </div>

            <p className="modal-description">
              {selectedProduct.description ||
                'No description provided.'}
            </p>

            <div className="seller-info">
              <div>
                <span>Seller</span>
                <strong>
                  @{selectedProduct.sellerUsername ||
                    selectedProduct.seller ||
                    'Seller'}
                </strong>
              </div>

              <div>
                <span>Condition</span>
                <strong>
                  {selectedProduct.condition || 'Good'}
                </strong>
              </div>

              <div>
                <span>Handover</span>
                <strong>
                  {selectedProduct.handleTime || 'Immediate'}
                </strong>
              </div>
            </div>

            <div className="request-note">
              <label htmlFor="request-note">
                Add a message to the seller
              </label>

              <textarea
                id="request-note"
                placeholder="Hi! I'm interested in this item..."
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary modal-buy-btn"
                onClick={() => handleBuyRequest(selectedProduct)}
                disabled={
                  requestingId === selectedProduct.id
                }
              >
                {requestingId === selectedProduct.id
                  ? 'Sending Request...'
                  : '📩 Send Buy Request'}
              </button>

              {selectedProduct.contact && (
                <a
                  href={`tel:${selectedProduct.contact}`}
                  className="btn-secondary"
                >
                  📞 Call Seller
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buy Request Success Modal */}
      {requestSuccessData && (
        <div
          className="modal-backdrop"
          onClick={() => setRequestSuccessData(null)}
        >
          <div
            className="success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setRequestSuccessData(null)}
            >
              ×
            </button>

            <div className="success-icon">✓</div>

            <span className="request-label">
              BUY REQUEST SENT
            </span>

            <h2>You're on it!</h2>

            <div className="request-id">
              Request #{requestSuccessData.requestId}
            </div>

            <p>
              Your request for{' '}
              <strong>
                "{requestSuccessData.productName}"
              </strong>{' '}
              has been sent to{' '}
              <strong>
                @{requestSuccessData.sellerUsername}
              </strong>.
            </p>

            <div className="request-next-step">
              <span>💬</span>
              <div>
                <strong>What's next?</strong>
                <p>
                  The seller can accept, reject, or chat
                  with you about the item.
                </p>
              </div>
            </div>

            <div className="success-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setRequestSuccessData(null);
                  navigate('/profile');
                }}
              >
                💬 Open Profile
              </button>

              <button
                className="btn-secondary"
                onClick={() => setRequestSuccessData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt */}
      {showLoginModal && (
        <LoginPromptModal
          serviceName="Buy & Sell Marketplace"
          serviceIcon="🛒"
          isActionBlocked={!!blockedAction}
          actionText={
            blockedAction || 'access this service'
          }
          onClose={() => {
            setShowLoginModal(false);
            setBlockedAction(null);
          }}
        />
      )}
    </div>
  );
};

export default BuySell;