import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LostFoundItem.css';

const LostFoundItem = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [form, setForm] = useState({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        contact: '',
        category: 'ID Cards & Wallets',
        photo: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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
                setForm(prev => ({ ...prev, photo: reader.result }));
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            alert('Please log in first to report an item.');
            navigate('/login');
            return;
        }

        if (!form.name || !form.location || !form.contact) {
            setError('Please fill in required fields (Item Name, Location, Contact Number).');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/lostfound', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (res.ok) {
                alert('🎉 Item reported successfully! Your profile activity has been updated.');
                navigate('/profile');
            } else {
                setError(data.message || 'Failed to submit report.');
            }
        } catch (err) {
            console.error(err);
            setError('Server error while reporting item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lost-form-page">
            <div className="lost-form-card">
                <div className="lost-form-header">
                    <button className="back-btn" type="button" onClick={() => navigate('/lostfound')}>
                        ←
                    </button>
                    <h2>Report Found Item</h2>
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
                    <div className="form-group">
                        <label>Item Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. College ID Card, Blue Water Bottle"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                            <option value="ID Cards & Wallets">ID Cards &amp; Wallets</option>
                            <option value="Electronics & Earphones">Electronics &amp; Earphones</option>
                            <option value="Keys & Accessories">Keys &amp; Accessories</option>
                            <option value="Books & Notebooks">Books &amp; Notebooks</option>
                            <option value="Bottles & Umbrellas">Bottles &amp; Umbrellas</option>
                            <option value="General Items">General Items</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Place Found *</label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Library Reading Hall, Cafeteria, Classroom 201..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Date Found *</label>
                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the item (colour, brand, distinguishing marks, where left for pickup)..."
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Contact Number *</label>
                        <input
                            type="tel"
                            name="contact"
                            value={form.contact}
                            onChange={handleChange}
                            placeholder="Enter contact number for owner to reach you"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Upload Image</label>
                        <input
                            type="text"
                            name="photo"
                            value={form.photo.startsWith('data:') ? '' : form.photo}
                            onChange={handleChange}
                            placeholder="Paste image URL (optional)"
                            style={{ marginBottom: '8px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Posting Report...' : 'Post Found Item'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LostFoundItem;