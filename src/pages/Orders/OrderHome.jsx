import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './OrderHome.css';

const OrderHome = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Active View: 'marketplace' or 'orders'
    const [activeView, setActiveView] = useState('marketplace');

    // Filter and Sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOption, setSortOption] = useState('newest');

    // Modals
    const [showSellModal, setShowSellModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Buy action state
    const [buyerContact, setBuyerContact] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [buyError, setBuyError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form state for Sell Modal
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        condition: 'Like New',
        handleTime: '',
        contact: '',
        category: 'Books',
        description: '',
        photo: ''
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load products from backend (only available products for marketplace)
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products?status=available');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            setProducts(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Could not load products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load orders from backend
    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await fetch('/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (activeView === 'marketplace') {
            fetchProducts();
        } else if (activeView === 'orders') {
            fetchOrders();
        }
    }, [activeView, fetchProducts, fetchOrders]);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Convert local image to base64
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setFormError('Image size should be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    photo: reader.result
                }));
                setFormError('');
            };
            reader.readAsDataURL(file);
        }
    };

    // Form submit for selling item
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        if (!formData.name || !formData.price || !formData.contact || !formData.category) {
            setFormError('Please fill in all required fields (Name, Price, Category, Contact Number).');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to list product');
            }

            // Success
            setFormData({
                name: '',
                price: '',
                originalPrice: '',
                condition: 'Like New',
                handleTime: '',
                contact: '',
                category: 'Books',
                description: '',
                photo: ''
            });
            setShowSellModal(false);
            setSuccessMessage('🎉 Product listed successfully! It is now live in the marketplace.');
            setTimeout(() => setSuccessMessage(''), 5000);
            fetchProducts();
        } catch (err) {
            setFormError(err.message || 'Error occurred while saving item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Buy Now flow
    const handleInitiateBuy = (product, e) => {
        if (e) e.stopPropagation();
        if (!token) {
            alert('Please log in first to purchase items.');
            navigate('/login');
            return;
        }

        if (user && (product.sellerId === user.id || product.sellerUsername === user.username)) {
            alert('You cannot buy your own listed item!');
            return;
        }

        setSelectedProduct(product);
        setBuyError('');
        setShowDetailsModal(false);
        setShowBuyModal(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedProduct) return;
        setIsBuying(true);
        setBuyError('');

        try {
            const response = await fetch(`/api/products/${selectedProduct.id}/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ contact: buyerContact })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to purchase product');
            }

            setShowBuyModal(false);
            setSuccessMessage(`🎉 Success! You have bought "${selectedProduct.name}". Your activity and orders have been updated!`);
            setTimeout(() => setSuccessMessage(''), 6000);
            fetchProducts();
        } catch (err) {
            setBuyError(err.message || 'Could not complete purchase.');
        } finally {
            setIsBuying(false);
        }
    };

    // Sorting and Filtering logic
    const filteredProducts = products.filter(prod => {
        const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortOption === 'price_asc') {
            return a.price - b.price;
        }
        if (sortOption === 'price_desc') {
            return b.price - a.price;
        }
        // default newest
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const categoriesList = [
        'All', 
        'Books', 
        'Electronics & Gadgets', 
        'Lab & Drawing Kits', 
        'Bicycles & Vehicles', 
        'Hostel & Daily Utilities', 
        'Others'
    ];

    const isOwnListing = (prod) => {
        if (!user) return false;
        return (prod.sellerId && prod.sellerId === user.id) || (prod.sellerUsername && prod.sellerUsername === user.username);
    };

    return (
        <div className='home_page'>
            {/* LEFT SIDE PANEL */}
            <div className="left-part">
                <div className="orderheading">Campus Marketplace</div>
                <div className="left-divider"></div>
                
                {/* View Switcher */}
                <div className="view-switcher-box">
                    <button 
                        className={`view-toggle-btn ${activeView === 'marketplace' ? 'active' : ''}`}
                        onClick={() => setActiveView('marketplace')}
                    >
                        🎒 Available Items ({products.length})
                    </button>
                    <button 
                        className={`view-toggle-btn ${activeView === 'orders' ? 'active' : ''}`}
                        onClick={() => {
                            if (!token) {
                                alert('Please log in to view your orders.');
                                navigate('/login');
                                return;
                            }
                            setActiveView('orders');
                        }}
                    >
                        📑 My Orders & History
                    </button>
                </div>

                {activeView === 'marketplace' && (
                    <>
                        {/* Sort Option */}
                        <div className="filter-section">
                            <label className="section-label">Sort Items</label>
                            <select 
                                value={sortOption} 
                                onChange={(e) => setSortOption(e.target.value)}
                                className="sort-select"
                            >
                                <option value="newest">🕒 Newest Listed</option>
                                <option value="price_asc">💵 Price: Low to High</option>
                                <option value="price_desc">📈 Price: High to Low</option>
                            </select>
                        </div>

                        {/* College Categories */}
                        <div className="filter-section">
                            <label className="section-label">College Categories</label>
                            <div className="category-list">
                                {categoriesList.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
                                    >
                                        {cat === 'All' ? '🌐 All Items' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats / Info */}
                        <div className="stats-box">
                            <div className="stats-title">🎒 Live Campus Listings</div>
                            <div className="stats-row">
                                <span>Available items:</span>
                                <strong>{products.length}</strong>
                            </div>
                            <div className="stats-row">
                                <span>Matching filters:</span>
                                <strong>{sortedProducts.length}</strong>
                            </div>
                            <div className="college-note">
                                💡 Directly buy or sell textbooks, drafters, calculators, cycles, and hostel items with verified PICT peers!
                            </div>
                        </div>
                    </>
                )}

                {/* Back to Profile Button */}
                <button className="back-profile-btn" onClick={() => navigate('/profile')}>
                    👤 View Your Profile & Activity
                </button>
            </div>

            {/* RIGHT SIDE PANEL */}
            <div className="right-part">
                {/* Upper Search and Action Bar */}
                <div className="upperorder">
                    <div className="searchorderitem">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder='Search campus listings by title or description...' 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="actions-wrapper">
                        <button 
                            type="button"
                            className="rent-switch-btn"
                            onClick={() => navigate('/rent')}
                        >
                            🏠 Rent Store
                        </button>
                        
                        <button 
                            type="button"
                            className="sell-btn"
                            onClick={() => {
                                if (!token) {
                                    alert('Please log in first to sell items.');
                                    navigate('/login');
                                    return;
                                }
                                setShowSellModal(true);
                            }}
                        >
                            + Sell Item
                        </button>
                    </div>
                </div>

                {/* Success Banner */}
                {successMessage && (
                    <div className="global-success-banner">
                        {successMessage}
                    </div>
                )}

                {/* Main Content Area */}
                {activeView === 'marketplace' ? (
                    <div className="products-container">
                        {loading ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <span>Loading campus listings...</span>
                            </div>
                        ) : error ? (
                            <div className="error-msg">{error}</div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="empty-msg">
                                📭 No active listings found matching your search.
                                <br />
                                <button className="inline-sell-btn" onClick={() => setShowSellModal(true)}>
                                    Be the first to list an item!
                                </button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {sortedProducts.map(product => {
                                    const isMine = isOwnListing(product);
                                    return (
                                        <div 
                                            key={product.id} 
                                            className={`product-card ${isMine ? 'own-card' : ''}`}
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <div className="product-card-img-wrapper">
                                                <img 
                                                    src={product.photo || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'} 
                                                    alt={product.name} 
                                                    className="product-card-img"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop';
                                                    }}
                                                />
                                                <span className="product-card-cat">{product.category}</span>
                                                {isMine && <span className="own-badge">Your Listing</span>}
                                            </div>
                                            <div className="product-card-info">
                                                <h3 className="product-card-title">{product.name}</h3>
                                                <div className="product-card-price-row">
                                                    <span className="product-card-price">₹{product.price}</span>
                                                    {product.condition && (
                                                        <span className="condition-tag">{product.condition}</span>
                                                    )}
                                                </div>
                                                <div className="product-card-meta">
                                                    <span className="meta-item">⏱️ {product.handleTime || 'Immediate'}</span>
                                                    <span className="meta-item">👤 @{product.sellerUsername || product.seller || 'Student'}</span>
                                                </div>
                                                
                                                <div className="card-actions">
                                                    {isMine ? (
                                                        <button 
                                                            className="card-view-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate('/profile');
                                                            }}
                                                        >
                                                            Manage in Profile
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="card-buy-btn"
                                                            onClick={(e) => handleInitiateBuy(product, e)}
                                                        >
                                                            ⚡ Buy Now
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ORDERS & HISTORY VIEW */
                    <div className="orders-container">
                        <div className="orders-header">
                            <h2>📑 Your Orders & Transactions</h2>
                            <p>All items you have purchased or sold on MarketPICT</p>
                        </div>

                        {loading ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <span>Loading orders...</span>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="empty-orders-box">
                                <div className="empty-icon">📦</div>
                                <h3>No orders yet</h3>
                                <p>When you buy items from peers or when other students buy your listings, transactions will appear here.</p>
                                <button className="cta-btn primary" onClick={() => setActiveView('marketplace')}>
                                    Explore Available Items
                                </button>
                            </div>
                        ) : (
                            <div className="orders-grid">
                                {orders.map(order => {
                                    const isBuyer = order.buyerId === user?.id;
                                    return (
                                        <div key={order.id} className="order-card">
                                            <div className="order-card-top">
                                                <span className={`order-type-badge ${isBuyer ? 'bought' : 'sold'}`}>
                                                    {isBuyer ? '🛒 Purchased' : '💰 Sold'}
                                                </span>
                                                <span className="order-date">
                                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="order-card-body">
                                                <img 
                                                    src={order.itemPhoto || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'} 
                                                    alt={order.itemName}
                                                    className="order-img"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop';
                                                    }}
                                                />
                                                <div className="order-details">
                                                    <h4>{order.itemName}</h4>
                                                    <div className="order-price">₹{order.price}</div>
                                                    <div className="order-meta-info">
                                                        <span>{isBuyer ? `Seller: @${order.sellerUsername}` : `Buyer: @${order.buyerUsername}`}</span>
                                                        <span>Contact: {isBuyer ? order.sellerContact : (order.buyerContact || 'In-app')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="order-status-bar">
                                                <span className="status-indicator">✅ Transaction Completed</span>
                                                <span className="order-id">#{order.id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DETAILS MODAL (ZOOM VIEW) */}
            {showDetailsModal && selectedProduct && (
                <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
                        <div className="details-modal-grid">
                            <div className="details-modal-left">
                                <img 
                                    src={selectedProduct.photo || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'} 
                                    alt={selectedProduct.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop';
                                    }}
                                />
                            </div>
                            <div className="details-modal-right">
                                <div className="modal-header-tags">
                                    <span className="detail-cat-badge">{selectedProduct.category}</span>
                                    {selectedProduct.condition && (
                                        <span className="detail-cond-badge">{selectedProduct.condition}</span>
                                    )}
                                    {isOwnListing(selectedProduct) && (
                                        <span className="own-badge modal">Your Listing</span>
                                    )}
                                </div>
                                
                                <h2 className="detail-title">{selectedProduct.name}</h2>
                                <div className="detail-price">₹{selectedProduct.price}</div>
                                
                                <div className="detail-info-block">
                                    <div className="info-row">
                                        <span className="info-label">⏱️ Handover Time:</span>
                                        <span className="info-value">{selectedProduct.handleTime || 'Immediate'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📞 Contact Phone:</span>
                                        <span className="info-value">{selectedProduct.contact}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">👤 Listed By:</span>
                                        <span className="info-value">@{selectedProduct.sellerUsername || selectedProduct.seller}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📅 Listed On:</span>
                                        <span className="info-value">{new Date(selectedProduct.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="detail-desc-title">Item Description</div>
                                <p className="detail-desc">{selectedProduct.description || 'No description provided.'}</p>

                                <div className="modal-action-buttons">
                                    {isOwnListing(selectedProduct) ? (
                                        <button 
                                            className="modal-manage-btn"
                                            onClick={() => {
                                                setShowDetailsModal(false);
                                                navigate('/profile');
                                            }}
                                        >
                                            👤 View & Manage in Profile
                                        </button>
                                    ) : (
                                        <button 
                                            className="modal-buy-btn"
                                            onClick={() => handleInitiateBuy(selectedProduct)}
                                        >
                                            ⚡ Buy This Item Now
                                        </button>
                                    )}
                                    <a 
                                        href={`tel:${selectedProduct.contact}`}
                                        className="contact-call-btn"
                                    >
                                        📞 Call Seller
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM BUY MODAL */}
            {showBuyModal && selectedProduct && (
                <div className="modal-backdrop" onClick={() => setShowBuyModal(false)}>
                    <div className="modal-content buy-confirm-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowBuyModal(false)}>×</button>
                        <h2>🛒 Confirm Your Purchase</h2>
                        <p className="buy-modal-subtitle">
                            You are purchasing <strong>{selectedProduct.name}</strong> from @{selectedProduct.sellerUsername || selectedProduct.seller}.
                        </p>

                        <div className="buy-summary-card">
                            <img 
                                src={selectedProduct.photo || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'} 
                                alt={selectedProduct.name}
                                className="buy-summary-thumb"
                            />
                            <div className="buy-summary-info">
                                <h3>{selectedProduct.name}</h3>
                                <div className="buy-summary-price">Total: ₹{selectedProduct.price}</div>
                                <div className="buy-summary-seller">Seller Contact: {selectedProduct.contact}</div>
                            </div>
                        </div>

                        {buyError && <div className="form-error">{buyError}</div>}

                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label>Your Contact Number (for seller coordination)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 9876543210" 
                                value={buyerContact}
                                onChange={(e) => setBuyerContact(e.target.value)}
                            />
                        </div>

                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="cancel-btn" onClick={() => setShowBuyModal(false)}>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="submit-btn buy-confirm-btn"
                                onClick={handleConfirmPurchase}
                                disabled={isBuying}
                            >
                                {isBuying ? 'Processing Purchase...' : `Confirm & Buy (₹${selectedProduct.price})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SELL ITEM MODAL */}
            {showSellModal && (
                <div className="modal-backdrop" onClick={() => setShowSellModal(false)}>
                    <div className="modal-content sell-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
                        <h2>List an Item to Sell</h2>
                        <p className="modal-subheading">Post your item so other PICT students can buy it immediately.</p>
                        {formError && <div className="form-error">{formError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Product Name / Headline *</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. Casio fx-991EX Calculator"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Selling Price (₹) *</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        value={formData.price} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 500"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleInputChange}
                                    >
                                        <option value="Books">Books</option>
                                        <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                                        <option value="Lab & Drawing Kits">Lab & Drawing Kits</option>
                                        <option value="Bicycles & Vehicles">Bicycles & Vehicles</option>
                                        <option value="Hostel & Daily Utilities">Hostel & Daily Utilities</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select 
                                        name="condition" 
                                        value={formData.condition} 
                                        onChange={handleInputChange}
                                    >
                                        <option value="Brand New">Brand New</option>
                                        <option value="Like New">Like New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Handover Time (Handle Time)</label>
                                    <input 
                                        type="text" 
                                        name="handleTime" 
                                        value={formData.handleTime} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. Immediate, Within 24 hours"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number *</label>
                                    <input 
                                        type="text" 
                                        name="contact" 
                                        value={formData.contact} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 9876543210"
                                        required 
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Image Upload / Paste URL</label>
                                    <input 
                                        type="text" 
                                        name="photo" 
                                        value={formData.photo} 
                                        onChange={handleInputChange} 
                                        placeholder="Paste image URL (optional)"
                                    />
                                    <div className="file-input-wrapper">
                                        <span>Or Upload File: </span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                    placeholder="Enter item details (condition, semester used, etc.)"
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowSellModal(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Posting...' : 'List Item Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHome;

