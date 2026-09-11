import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const { isAuthenticated, user, logout } = useAuth();

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
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="sell-button"
                onClick={() => navigate("/sell-item")}
              >
                + Sell Item
              </button>

              <button
                type="button"
                className="user-badge"
                onClick={() => navigate("/profile")}
                title="View Profile"
              >
                <span>👤</span>
                <span>@{user?.username || 'Profile'}</span>
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Sign Out"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              <button
                type="button"
                className="signup-button"
                onClick={() => navigate("/sign")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;