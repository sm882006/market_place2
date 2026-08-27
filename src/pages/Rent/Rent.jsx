import { useNavigate } from 'react-router-dom';
import './Rent.css';

const Rent = () => {

  const navigate = useNavigate();

  return (
    <div className="marketplace">

      <div className="marketplace-header">

        <h1>Rent Marketplace</h1>

        <button
          className="sell-btn"
          onClick={() => navigate('/rent-item')}
        >
          + Rent Your Product
        </button>

      </div>

      <div className="products">

        <div className="product-card">
          <img
            src="https://via.placeholder.com/200"
            alt="Camera"
          />
          <h3>DSLR Camera</h3>
          <p>₹200 / day</p>
          <button>View Details</button>
        </div>

        <div className="product-card">
          <img
            src="https://via.placeholder.com/200"
            alt="Laptop"
          />
          <h3>Laptop</h3>
          <p>₹300 / day</p>
          <button>View Details</button>
        </div>

        <div className="product-card">
          <img
            src="https://via.placeholder.com/200"
            alt="Cycle"
          />
          <h3>Mountain Cycle</h3>
          <p>₹100 / day</p>
          <button>View Details</button>
        </div>

      </div>

    </div>
  );
};

export default Rent;