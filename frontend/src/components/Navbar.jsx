import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">Art Marketplace</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/">Home</Link>
        {currentUser ? (
          <>
            <Link to="/upload">Upload Art</Link>
            {isAdmin && (
              <Link to="/admin" className="admin-link">
                Admin Dashboard
              </Link>
            )}
            <span className="user-name">
              Welcome, {currentUser.displayName || 'User'}
              {isAdmin && <span className="admin-badge">(Admin)</span>}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
