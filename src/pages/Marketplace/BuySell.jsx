import { useNavigate } from 'react-router-dom';
import './BuySell.css';

const BuySell = () => {
  const navigate = useNavigate();

  // Dummy product data – replace with your actual state
  const products = [
    { id: 1, name: 'Laptop', price: '₹25,000', category: 'Electronics', condition: 'Excellent', img: 'https://via.placeholder.com/200' },
    { id: 2, name: 'Scientific Calculator', price: '₹500', category: 'Electronics', condition: 'Like New', img: 'https://via.placeholder.com/200' },
    { id: 3, name: 'Mountain Cycle', price: '₹6,000', category: 'Sports', condition: 'Good', img: 'https://via.placeholder.com/200' },
    { id: 4, name: 'Engineering Books Set', price: '₹1,200', category: 'Books', condition: 'Used', img: 'https://via.placeholder.com/200' },
    { id: 5, name: 'Study Chair', price: '₹1,800', category: 'Furniture', condition: 'Like New', img: 'https://via.placeholder.com/200' },
    { id: 6, name: 'Wireless Headphones', price: '₹2,200', category: 'Electronics', condition: 'New', img: 'https://via.placeholder.com/200' },
  ];

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>Buy &amp; Sell Marketplace</h1>
        <button className="sell-btn" onClick={() => navigate('/sell-item')}>
          + Sell Your Item
        </button>
      </div>

      <div className="marketplace-controls">
        <input type="text" placeholder="Search for items..." />
        <select defaultValue="">
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Sports">Sports</option>
          <option value="Furniture">Furniture</option>
        </select>
      </div>

      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.img} alt={product.name} />
            <h3>{product.name}</h3>
            <div className="meta">
              <span>{product.category}</span>
              <span>{product.condition}</span>
            </div>
            <p className="price">{product.price}</p>
            <button onClick={() => navigate(`/product/${product.id}`)}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuySell;