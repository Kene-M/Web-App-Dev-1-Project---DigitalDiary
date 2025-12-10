import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <h1 className="logo">DigitalDiary</h1>
          <Link to="/feed" className="nav-link">
            Home
          </Link>
          <Link to="/create" className="nav-link">
            Create
          </Link>
        </div>
        <div className="nav-right">
          <span className="nav-username">{username || 'User'}</span>
          <button onClick={handleLogout} className="nav-link logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
