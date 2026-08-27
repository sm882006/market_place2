import React from 'react';
import './SellItem.css';

const SellItem = () => {
  return (
    <div className="sell-page">

      <div className="sell-card">

        <h2>Sell Your Item</h2>

        <form>

          <label>Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
          />

          <label>Category</label>
          <input
            type="text"
            placeholder="Laptop, Cycle, Books..."
          />

          <label>Date of Purchase</label>
          <input type="date" />

          <label>Original Price</label>
          <input
            type="number"
            placeholder="Price when bought"
          />

          <label>Selling Price</label>
          <input
            type="number"
            placeholder="Price you want"
          />

          <label>Condition</label>
          <select>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
          </select>

          <label>Description</label>
          <textarea
            placeholder="Write details about the product"
          />

          <label>Upload Image</label>
          <input type="file" multiple />

          <button type="submit">
            Post Product
          </button>

        </form>

      </div>

    </div>
  );
};

export default SellItem;