import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

const Wishlist = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    return JSON.parse(
      localStorage.getItem("campusmart-wishlist") || "[]"
    );
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistItems = async () => {
      try {
        setLoading(true);
        const [prodRes, rentRes] = await Promise.allSettled([
          fetch("/api/products"),
          fetch("/api/rents")
        ]);

        let allItems = [];

        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          const prods = await prodRes.value.json();
          allItems = [
            ...allItems,
            ...prods.map((p) => ({
              ...p,
              type: "product",
              displayPrice: `₹${p.price}`,
            })),
          ];
        }

        if (rentRes.status === "fulfilled" && rentRes.value.ok) {
          const rents = await rentRes.value.json();
          allItems = [
            ...allItems,
            ...rents.map((r) => ({
              ...r,
              type: "rent",
              displayPrice: `₹${r.rentPerDay} / day`,
              category: r.category || "Rental",
            })),
          ];
        }

        const savedProducts = allItems.filter((item) =>
          wishlist.includes(item.id)
        );

        setProducts(savedProducts);
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistItems();
  }, [wishlist]);

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter((id) => id !== productId);

    setWishlist(updated);

    localStorage.setItem(
      "campusmart-wishlist",
      JSON.stringify(updated)
    );
  };

  return (
    <div className="wishlist-page">
      <main className="wishlist-container">

        <section className="wishlist-header">
          <div>
            <span className="wishlist-eyebrow">
              CAMPUSMART
            </span>

            <h1>My Wishlist</h1>

            <p>
              Items you've saved for later.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={() => navigate("/marketplace")}
          >
            ← Browse Marketplace
          </button>
        </section>

        {loading ? (
          <div className="wishlist-state glass-card">
            <div className="loading-spinner" />
            <h3>Loading your wishlist...</h3>
            <p>Finding your saved items.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="wishlist-state glass-card">
            <div className="wishlist-empty-icon">♡</div>

            <h2>Your wishlist is empty</h2>

            <p>
              Save items you like from the marketplace and
              they'll appear here.
            </p>

            <button
              className="btn-primary"
              onClick={() => navigate("/marketplace")}
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-summary">
              <strong>{products.length}</strong>{" "}
              {products.length === 1 ? "item" : "items"} saved
            </div>

            <section className="wishlist-grid">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="wishlist-card glass-card"
                >
                  <div className="wishlist-image-wrapper">

                    <img
                      src={
                        product.photo ||
                        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop"
                      }
                      alt={product.name}
                      className="wishlist-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop";
                      }}
                    />

                    <button
                      className="wishlist-remove"
                      onClick={() =>
                        removeFromWishlist(product.id)
                      }
                      aria-label="Remove from wishlist"
                    >
                      ♥
                    </button>
                  </div>

                  <div className="wishlist-content">

                    <div className="wishlist-meta">
                      <span className="category-badge">
                        {product.category}
                      </span>

                      <span className="condition-badge">
                        {product.condition || "Good"}
                      </span>
                    </div>

                    <h3>{product.name}</h3>

                    <p className="wishlist-description">
                      {product.description ||
                        "No description provided."}
                    </p>

                    <div className="wishlist-price">
                      {product.displayPrice || `₹${product.price}`}
                    </div>

                    <div className="wishlist-actions">
                      <button
                        className="details-btn"
                        onClick={() =>
                          navigate(product.type === "rent" ? "/rent" : "/marketplace")
                        }
                      >
                        {product.type === "rent" ? "View in Rentals" : "View in Marketplace"}
                      </button>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeFromWishlist(product.id)
                        }
                      >
                        Remove
                      </button>
                    </div>

                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Wishlist;