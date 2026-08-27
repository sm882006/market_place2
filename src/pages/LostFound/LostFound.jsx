import { useNavigate } from 'react-router-dom';
import './LostFound.css';

const LostFound = () => {
    const navigate = useNavigate();

    // Dummy data – replace with real data later
    const foundItems = [
        {
            id: 1,
            name: 'College ID Card',
            location: 'Near Main Gate',
            date: '20 June 2025',
            image: 'https://via.placeholder.com/200',
            status: 'unclaimed', // or 'claimed'
        },
        {
            id: 2,
            name: 'Keys',
            location: 'Near Library',
            date: '18 June 2025',
            image: 'https://via.placeholder.com/200',
            status: 'unclaimed',
        },
        {
            id: 3,
            name: 'Water Bottle',
            location: 'Cafeteria',
            date: '15 June 2025',
            image: 'https://via.placeholder.com/200',
            status: 'claimed',
        },
        {
            id: 4,
            name: 'Notebook',
            location: 'Classroom 201',
            date: '12 June 2025',
            image: 'https://via.placeholder.com/200',
            status: 'unclaimed',
        },
    ];

    return (
        <div className="lostfound-page">
            <div className="lostfound-header">
                <h1>Lost &amp; Found</h1>
                <button className="report-btn" onClick={() => navigate('/lostfound-item')}>
                    + Report Found Item
                </button>
            </div>

            <div className="lostfound-controls">
                <input type="text" placeholder="Search for lost items..." />
                <select defaultValue="">
                    <option value="">All Locations</option>
                    <option value="Library">Library</option>
                    <option value="Main Gate">Main Gate</option>
                    <option value="Cafeteria">Cafeteria</option>
                    <option value="Classroom">Classroom</option>
                </select>
            </div>

            <div className="found-items">
                {foundItems.map((item) => (
                    <div key={item.id} className="found-card">
                        <img src={item.image} alt={item.name} />
                        <div className="card-body">
                            <h3>{item.name}</h3>
                            <div className="meta">
                                <div className="meta-item">
                                    <span className="icon">📍</span>
                                    <span>{item.location}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="icon">📅</span>
                                    <span>{item.date}</span>
                                </div>
                            </div>
                            <span className={`status ${item.status}`}>
                                {item.status === 'unclaimed' ? 'Unclaimed' : 'Claimed'}
                            </span>
                            <button onClick={() => navigate(`/found-item/${item.id}`)}>
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LostFound;