import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import StarRating from '../../components/StarRating';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import './ProductDetail.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);

  // Buy Request Modal
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyerContact, setBuyerContact] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('PICT Campus Quad');
  const [submittingBuy, setSubmittingBuy] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/products/${id}`);
      setProduct(data.product);
      setSeller(data.seller);
      setSimilarProducts(data.similarProducts || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const checkWishlistStatus = useCallback(async () => {
    if (!user) return;
    try {
      const items = await apiFetch('/api/wishlist');
      const found = items.some((i) => String(i.itemId) === String(id));
      setInWishlist(found);
    } catch {
      // ignore
    }
  }, [id, user]);

  useEffect(() => {
    fetchProductDetails();
    checkWishlistStatus();
  }, [fetchProductDetails, checkWishlistStatus]);

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info('Please log in to save items to your wishlist');
      return;
    }
    try {
      const res = await apiFetch('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ itemId: id, itemType: 'product' }),
      });
      setInWishlist(res.saved);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist');
    }
  };

  const handleBuyRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to request this item');
      return;
    }

    try {
      setSubmittingBuy(true);
      const res = await apiFetch(`/api/products/${id}/buy-request`, {
        method: 'POST',
        body: JSON.stringify({ buyerContact, meetingLocation }),
      });
      toast.success(res.message || 'Buy request submitted!');
      setShowBuyModal(false);
      fetchProductDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to submit buy request');
    } finally {
      setSubmittingBuy(false);
    }
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      toast.info('Please log in to chat with the seller');
      return;
    }
    if (user.username === product?.sellerUsername) {
      toast.info('This is your own listing.');
      return;
    }

    try {
      const chat = await apiFetch('/api/chats/find-or-create', {
        method: 'POST',
        body: JSON.stringify({
          targetUsername: product.sellerUsername,
          productId: product.id,
          productTitle: product.name,
        }),
      });
      navigate(`/profile?tab=messages&chatId=${chat.id}`);
    } catch (err) {
      toast.error(err.message || 'Unable to start chat');
    }
  };

  const handleReportListing = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to submit a report');
      return;
    }

    try {
      setSubmittingReport(true);
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'product',
          targetId: product.id,
          targetTitle: product.name,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      toast.success(res.message || 'Report submitted to campus moderators');
      setShowReportModal(false);
      setReportDetails('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2>Product not found</h2>
        <p>This listing may have been removed or sold.</p>
        <button className="btn-secondary-action" onClick={() => navigate('/marketplace')} style={{ margin: '20px auto' }}>
          Back to Marketplace
        </button>
      </div>
    );
  }

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const isOwner = user?.username === product.sellerUsername;
  const isAvailable = product.status === 'available';

  return (
    <div className="product-detail-container">
      <button className="back-link-btn" onClick={() => navigate('/marketplace')}>
        ← Back to Marketplace
      </button>

      <div className="product-detail-grid">
        {/* Left: Photos */}
        <div className="product-gallery">
          <div className="main-image-wrapper">
            {product.photo ? (
              <img src={product.photo} alt={product.name} className="main-product-img" />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '3rem' }}>📦</div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="product-info-panel">
          <div className="product-badges">
            <span className="badge-tag category">{product.category}</span>
            <span className="badge-tag condition">Condition: {product.condition}</span>
            {product.status !== 'available' && (
              <span className={`badge-tag status-${product.status}`}>
                {product.status.toUpperCase()}
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                color: inWishlist ? '#ef4444' : '#94a3b8',
              }}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              {inWishlist ? '♥' : '♡'}
            </button>
          </div>

          <h1 className="product-title">{product.name}</h1>

          <div className="product-pricing">
            <span className="product-price">₹{product.price}</span>
            {product.originalPrice && (
              <span className="product-original-price">₹{product.originalPrice}</span>
            )}
            {discountPercent && <span className="discount-badge">{discountPercent}% OFF</span>}
          </div>

          {/* Seller Trust Card */}
          <div className="seller-trust-card">
            <div className="seller-avatar">
              {product.sellerUsername.charAt(0).toUpperCase()}
            </div>
            <div className="seller-meta">
              <div className="seller-name-row">
                <span className="seller-name">@{product.sellerUsername}</span>
                {seller?.isVerified && (
                  <span className="verified-student-badge">
                    ✓ Verified Student
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <StarRating
                  value={seller?.ratingsAverage || 5.0}
                  count={seller?.ratingsCount || 0}
                  size="0.85rem"
                />
                {seller?.department && (
                  <span style={{ color: '#64748b' }}>• {seller.department}</span>
                )}
              </div>
            </div>
          </div>

          {/* Specification details */}
          <div className="detail-specs-list">
            <div className="spec-item">
              <span className="spec-label">Handover Location</span>
              <span className="spec-val">📍 {product.location || 'PICT Campus'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Availability / Speed</span>
              <span className="spec-val">⚡ {product.handleTime || 'Immediate'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Contact</span>
              <span className="spec-val">📞 {product.contact}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Views</span>
              <span className="spec-val">👁️ {product.views || 1} campus views</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="spec-label" style={{ display: 'block', marginBottom: '6px' }}>
              Description
            </span>
            <p className="product-description-text">
              {product.description || 'No additional description provided by the student.'}
            </p>
          </div>

          {/* Actions */}
          <div className="action-buttons-group">
            {isOwner ? (
              <button
                className="btn-secondary-action"
                style={{ flex: 1 }}
                onClick={() => navigate('/profile')}
              >
                Manage in My Listings
              </button>
            ) : (
              <>
                <button
                  className="btn-primary-action"
                  disabled={!isAvailable}
                  onClick={() => setShowBuyModal(true)}
                >
                  {isAvailable ? '🛒 Request to Buy' : `Unavailable (${product.status})`}
                </button>
                <button className="btn-secondary-action" onClick={handleChatWithSeller}>
                  💬 Chat
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              🚩 Report this listing
            </button>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="similar-items-section">
          <h2 className="section-headline">Similar Items in {product.category}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {similarProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/marketplace/${p.id}`)}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ height: '140px', background: '#f8fafc', overflow: 'hidden' }}>
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      📦
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <h4
                    style={{
                      margin: '0 0 4px',
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.name}
                  </h4>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>₹{p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Request Modal */}
      {showBuyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>
              Confirm Buy Request for ₹{product.price}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              The seller will review your request. Once accepted, you can complete the cash/UPI
              handover on campus!
            </p>

            <form onSubmit={handleBuyRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Your Phone / WhatsApp Contact
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Preferred Handover Location
                </label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g. Library, Canteen, Main Gate"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowBuyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submittingBuy}
                >
                  {submittingBuy ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>Report Listing</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '18px' }}>
              Reports are sent to campus administrators for review. Help us maintain a trustworthy student community.
            </p>

            <form onSubmit={handleReportListing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Scam / Fake Item">Scam / Fake Item</option>
                  <option value="Incorrect Information">Incorrect Information</option>
                  <option value="Harassment / Abuse">Harassment / Abuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Details / Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Explain why this listing violates campus guidelines..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  style={{ background: '#dc2626' }}
                  disabled={submittingReport}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
