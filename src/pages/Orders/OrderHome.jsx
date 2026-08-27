import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './OrderHome.css';

const OrderHome = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and Sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOption, setSortOption] = useState('newest');

    // Modals
    const [showSellModal, setShowSellModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        handleTime: '',
        contact: '',
        category: 'Books',
        description: '',
        photo: ''
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load products from backend
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products');
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
    };

    useEffect(() => {
        fetchProducts();
    }, []);

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

    // Form submit
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
                handleTime: '',
                contact: '',
                category: 'Books',
                description: '',
                photo: ''
            });
            setShowSellModal(false);
            fetchProducts();
        } catch (err) {
            setFormError(err.message || 'Error occurred while saving item.');
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className='home_page'>
            {/* LEFT SIDE PANEL */}
            <div className="left-part">
                <div className="orderheading">Buy & Sell Section</div>
                <div className="left-divider"></div>
                
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
                    <div className="stats-title">🎒 Campus Marketplace</div>
                    <div className="stats-row">
                        <span>Available listings:</span>
                        <strong>{products.length}</strong>
                    </div>
                    <div className="stats-row">
                        <span>Matching items:</span>
                        <strong>{sortedProducts.length}</strong>
                    </div>
                    <div className="college-note">
                        💡 Easily trade textbooks, drawing kits, calculators, mattresses, and cycles with peers right inside your hostel or campus building!
                    </div>
                </div>

                {/* Back to Profile Button */}
                <button className="back-profile-btn" onClick={() => navigate('/profile')}>
                    ← Back to Profile
                </button>
            </div>

            {/* RIGHT SIDE PANEL */}
            <div className="right-part">
                <div className="upperorder">
                    <div className="searchorderitem">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder='Search products by title or description...' 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="actions-wrapper">
                        {/* The Special Button placed to the right of the search bar, styled */}
                        <button 
                            type="button"
                            className="special-button"
                            onClick={() => alert('This button will have custom actions configured in the next phase! Currently styled.')}
                        >
                            ✨ Special Button
                        </button>
                        
                        <button 
                            type="button"
                            className="sell-btn"
                            onClick={() => {
                                if (!token) {
                                    alert('Please log in first. You can log in from the login page.');
                                    return;
                                }
                                setShowSellModal(true);
                            }}
                        >
                            Sell Item
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="products-container">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <span>Loading campus listings...</span>
                        </div>
                    ) : error ? (
                        <div className="error-msg">{error}</div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="empty-msg">No items found matching the selected filters.</div>
                    ) : (
                        <div className="products-grid">
                            {sortedProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className="product-card"
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
                                    </div>
                                    <div className="product-card-info">
                                        <h3 className="product-card-title">{product.name}</h3>
                                        <div className="product-card-price">₹{product.price}</div>
                                        <div className="product-card-meta">
                                            <span className="meta-item">⏱️ {product.handleTime}</span>
                                            <span className="meta-item">📞 {product.contact}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                                <span className="detail-cat-badge">{selectedProduct.category}</span>
                                <h2 className="detail-title">{selectedProduct.name}</h2>
                                <div className="detail-price">₹{selectedProduct.price}</div>
                                
                                <div className="detail-info-block">
                                    <div className="info-row">
                                        <span className="info-label">⏱️ Handover Time:</span>
                                        <span className="info-value">{selectedProduct.handleTime}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📞 Contact Phone:</span>
                                        <span className="info-value">{selectedProduct.contact}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">👤 Listed By:</span>
                                        <span className="info-value">@{selectedProduct.seller}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📅 Listed On:</span>
                                        <span className="info-value">{new Date(selectedProduct.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="detail-desc-title">Item Description</div>
                                <p className="detail-desc">{selectedProduct.description || 'No description provided.'}</p>

                                <a 
                                    href={`tel:${selectedProduct.contact}`}
                                    className="contact-call-btn"
                                >
                                    📞 Call / Contact Seller
                                </a>
                            </div>
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
                                    <label>Price (₹) *</label>
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
                                <div className="form-group">
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
