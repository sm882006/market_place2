import './RentItem.css';

const RentItem = () => {
  return (
    <div className="rent-form-page">

      <div className="rent-form-card">

        <h2>Rent Your Product</h2>

        <form>

  <label>Product Name</label>
  <input
    type="text"
    placeholder="Enter product name"
  />

  <label>Category</label>
  <input
    type="text"
    placeholder="Laptop, Camera, Cycle..."
  />

  <label>Rent Per Day (₹)</label>
  <input
    type="number"
    placeholder="Enter rent amount"
  />

  <label>Security Deposit (₹)</label>
  <input
    type="number"
    placeholder="Enter deposit amount"
  />

  <label>Available From</label>
  <input type="date" />

  <label>Available Till</label>
  <input type="date" />

  <label>Product Description</label>
  <textarea
    placeholder="Describe the condition and features"
  ></textarea>

  <label>Upload Product Images</label>
  <input
    type="file"
    multiple
  />

  <button type="submit">
    Post Product
  </button>

  <button
    type="button"
    className="back-btn"
    onClick={() => window.history.back()}
  >
    ← Back
  </button>

</form>

      </div>

    </div>

    
  );
};

export default RentItem;