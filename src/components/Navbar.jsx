import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Rent", path: "/rent" },
  { label: "Lost & Found", path: "/lostfound" },
  { label: "Wishlist", path: "/wishlist" },
];

function Navbar() {
  const navigate = useNavigate();

  const getNavClass = ({ isActive }) =>
    `navbar-link ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <span className="logo-mark">M</span>
          <span className="logo-text">
            Campus<span>Mart</span>
          </span>
        </NavLink>

        {/* Navigation */}
        <nav className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={getNavClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button
            className="sell-button"
            onClick={() => navigate("/sell-item")}
          >
            + Sell Item
          </button>

          <button
            className="profile-button"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
          >
            <span className="profile-icon">👤</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;