import { useNavigate } from 'react-router-dom';
import './LostFoundItem.css';

const LostFoundItem = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        alert('Item reported successfully!');
        navigate('/lostfound'); // Redirect to Lost & Found page after submit
    };

    return (
        <div className="lost-form-page">
            <div className="lost-form-card">
                <div className="lost-form-header">
                    <button className="back-btn" onClick={() => navigate('/lostfound')}>
                        ←
                    </button>
                    <h2>Report Found Item</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Item Name *</label>
                        <input type="text" placeholder="Enter item name" required />
                    </div>

                    <div className="form-group">
                        <label>Place Found *</label>
                        <input type="text" placeholder="Library, Canteen, Hostel..." required />
                    </div>

                    <div className="form-group">
                        <label>Date Found *</label>
                        <input type="date" required />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea placeholder="Describe the item (colour, brand, distinguishing marks...)"></textarea>
                    </div>

                    <div className="form-group">
                        <label>Contact Number *</label>
                        <input type="tel" placeholder="Enter contact number" required />
                    </div>

                    <div className="form-group">
                        <label>Upload Image</label>
                        <input type="file" accept="image/*" />
                    </div>

                    <button type="submit">Post Found Item</button>
                </form>
            </div>
        </div>
    );
};

export default LostFoundItem;