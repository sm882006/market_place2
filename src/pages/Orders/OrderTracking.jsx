import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import StarRating from '../../components/StarRating';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import './OrderTracking.css';

export default function OrderTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/orders');
      setOrders(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus, note) => {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note }),
      });
      toast.success(`Order updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrder) return;

    try {
      setSubmittingReview(true);
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: reviewOrder.id,
          rating,
          comment: reviewComment,
        }),
      });
      toast.success(res.message || 'Review submitted!');
      setReviewOrder(null);
      setReviewComment('');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleChat = async (targetUsername, itemId, title) => {
    try {
      const chat = await apiFetch('/api/chats/find-or-create', {
        method: 'POST',
        body: JSON.stringify({
          targetUsername,
          productId: itemId,
          productTitle: title,
        }),
      });
      navigate(`/profile?tab=messages&chatId=${chat.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to open chat');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const isBuyer = o.buyerUsername === user?.username || o.buyerId === user?.id;
    const isSeller = o.sellerUsername === user?.username || o.sellerId === user?.id;

    if (activeTab === 'buying') return isBuyer;
    if (activeTab === 'selling') return isSeller;
    if (activeTab === 'active') return o.status === 'pending' || o.status === 'approved';
    if (activeTab === 'completed') return o.status === 'completed' || o.status === 'returned';
    return true;
  });

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">Orders & Tracking</h1>
        <p className="orders-subtitle">
          Track transaction timelines, coordinate meetups on campus, and leave seller ratings.
        </p>
      </div>

      <div className="orders-tabs">
        <button
          className={`orders-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`orders-tab-btn ${activeTab === 'buying' ? 'active' : ''}`}
          onClick={() => setActiveTab('buying')}
        >
          Purchases / Rentals
        </button>
        <button
          className={`orders-tab-btn ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => setActiveTab('selling')}
        >
          Sales / Rented Out
        </button>
        <button
          className={`orders-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          In Progress
        </button>
        <button
          className={`orders-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="list" />
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '20px' }}>
          <span style={{ fontSize: '3rem' }}>🛍️</span>
          <h3 style={{ margin: '12px 0 6px', color: '#1e293b' }}>No orders found</h3>
          <p style={{ color: '#64748b' }}>Browse marketplace items to make your first purchase or rental!</p>
          <button className="order-btn primary" onClick={() => navigate('/marketplace')} style={{ marginTop: '14px' }}>
            Explore Marketplace
          </button>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const isBuyer = order.buyerUsername === user?.username || order.buyerId === user?.id;
          const isSeller = order.sellerUsername === user?.username || order.sellerId === user?.id;
          const counterpart = isBuyer ? order.sellerUsername : order.buyerUsername;

          const steps = ['pending', 'approved', order.orderType === 'rent' ? 'returned' : 'completed'];
          const currentStepIndex =
            order.status === 'completed' || order.status === 'returned'
              ? 2
              : order.status === 'approved'
              ? 1
              : 0;

          return (
            <div key={order.id} className="order-card">
              <div className="order-top-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="order-id-badge">ORDER #{order.id.slice(-6).toUpperCase()}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: order.orderType === 'rent' ? '#f0fdf4' : '#eff6ff',
                      color: order.orderType === 'rent' ? '#166534' : '#1e40af',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {order.orderType}
                  </span>
                </div>
                <span className={`order-status-pill ${order.status}`}>{order.status}</span>
              </div>

              <div className="order-body">
                {order.photo ? (
                  <img src={order.photo} alt={order.title} className="order-item-img" />
                ) : (
                  <div
                    className="order-item-img"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}
                  >
                    📦
                  </div>
                )}

                <div className="order-details">
                  <h3 className="order-item-title">{order.title}</h3>
                  <div className="order-parties-text">
                    {isBuyer ? (
                      <>Seller: <strong>@{order.sellerUsername}</strong></>
                    ) : (
                      <>Buyer: <strong>@{order.buyerUsername}</strong></>
                    )}
                    {order.meetingLocation && (
                      <span style={{ marginLeft: '8px', color: '#64748b' }}>
                        • 📍 {order.meetingLocation}
                      </span>
                    )}
                  </div>
                  <div className="order-amount-text">
                    ₹{order.totalAmount || order.price}
                    {order.deposit > 0 && (
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                        (incl. ₹{order.deposit} deposit)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="order-timeline-wrapper">
                <div className="timeline-steps">
                  <div className="timeline-step">
                    <div className={`step-circle ${currentStepIndex >= 0 ? 'completed' : ''}`}>
                      ✓
                    </div>
                    <span className="step-label">Requested</span>
                  </div>

                  <div style={{ flex: 1, height: '2px', background: currentStepIndex >= 1 ? '#0284c7' : '#e2e8f0' }} />

                  <div className="timeline-step">
                    <div
                      className={`step-circle ${
                        currentStepIndex >= 1 ? 'completed' : currentStepIndex === 0 ? 'active' : ''
                      }`}
                    >
                      {currentStepIndex >= 1 ? '✓' : '2'}
                    </div>
                    <span className="step-label">Approved</span>
                  </div>

                  <div style={{ flex: 1, height: '2px', background: currentStepIndex >= 2 ? '#10b981' : '#e2e8f0' }} />

                  <div className="timeline-step">
                    <div className={`step-circle ${currentStepIndex >= 2 ? 'completed' : ''}`}>
                      {currentStepIndex >= 2 ? '✓' : '3'}
                    </div>
                    <span className="step-label">
                      {order.orderType === 'rent' ? 'Returned' : 'Handover Done'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="order-actions-bar">
                <button
                  className="order-btn secondary"
                  onClick={() => handleChat(counterpart, order.itemId, order.title)}
                >
                  💬 Chat with @{counterpart}
                </button>

                {/* Seller Actions */}
                {isSeller && order.status === 'approved' && (
                  <button
                    className="order-btn success"
                    onClick={() =>
                      handleUpdateStatus(
                        order.id,
                        order.orderType === 'rent' ? 'returned' : 'completed',
                        'Handover completed and verified by seller'
                      )
                    }
                  >
                    Mark Handover Complete
                  </button>
                )}

                {/* Buyer Actions: Review */}
                {isBuyer && (order.status === 'completed' || order.status === 'approved') && (
                  <>
                    {order.isReviewed ? (
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: '#059669',
                          fontWeight: 600,
                          alignSelf: 'center',
                        }}
                      >
                        ✓ Reviewed
                      </span>
                    ) : (
                      <button
                        className="order-btn primary"
                        onClick={() => {
                          setReviewOrder(order);
                          setRating(5);
                          setReviewComment('');
                        }}
                      >
                        ⭐ Rate & Review Seller
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Review Modal */}
      {reviewOrder && (
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
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>
              Rate @{reviewOrder.sellerUsername}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
              How was your experience buying "{reviewOrder.title}"? Your rating helps fellow PICT
              students shop safely.
            </p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', margin: '8px 0' }}>
                <StarRating value={rating} onChange={setRating} size="2.2rem" showNumber={false} />
                <div style={{ marginTop: '6px', fontWeight: 700, color: '#0284c7' }}>
                  {rating === 5
                    ? 'Excellent (5/5)'
                    : rating === 4
                    ? 'Very Good (4/5)'
                    : rating === 3
                    ? 'Average (3/5)'
                    : rating === 2
                    ? 'Poor (2/5)'
                    : 'Terrible (1/5)'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Your Review / Feedback
                </label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Fast handover, item exactly as described..."
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="order-btn secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReviewOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="order-btn primary"
                  style={{ flex: 1 }}
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
