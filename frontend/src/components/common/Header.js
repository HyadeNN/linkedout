import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services';

const Header = ({
  unreadCount,
  toggleNotificationPanel,
  isDarkMode,
  toggleTheme
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const results = await userService.searchUsers(query);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (userId) => {
    navigate(`/users/${userId}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          <h1>LinkedOut</h1>
        </Link>

        <div className="search-container" ref={searchRef}>
          <input
            type="text"
            placeholder="Search for people, jobs, etc."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(result.id)}
                >
                  <img
                    src={result.profile?.profile_image || '/default-avatar.jpg'}
                    alt={`${result.first_name} ${result.last_name}`}
                    className="search-result-avatar"
                  />
                  <div className="search-result-info">
                    <p className="search-result-name">{result.first_name} {result.last_name}</p>
                    <p className="search-result-headline">{result.profile?.headline || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <nav className="main-nav">
          <Link to="/" className="nav-item">
            <i className="nav-icon">🏠</i>
            <span>Home</span>
          </Link>
          <Link to="/network" className="nav-item">
            <i className="nav-icon">👥</i>
            <span>Network</span>
          </Link>
          <Link to="/jobs" className="nav-item">
            <i className="nav-icon">💼</i>
            <span>Jobs</span>
          </Link>
          <div className="nav-item" onClick={toggleNotificationPanel}>
            <div className="notification-icon">
              <i className="nav-icon">🔔</i>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>
            <span>Notifications</span>
          </div>
          <div className="nav-item user-menu" ref={dropdownRef}>
            <div onClick={() => setShowDropdown(!showDropdown)}>
              <img
                src={user?.profile?.profile_image || '/default-avatar.jpg'}
                alt={`${user?.first_name} ${user?.last_name}`}
                className="user-avatar"
              />
              <span>Me</span>
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <img
                    src={user?.profile?.profile_image || '/default-avatar.jpg'}
                    alt={`${user?.first_name} ${user?.last_name}`}
                    className="dropdown-avatar"
                  />
                  <div>
                    <p className="dropdown-name">{user?.first_name} {user?.last_name}</p>
                    <p className="dropdown-headline">{user?.profile?.headline || ''}</p>
                  </div>
                </div>

                <Link to="/profile" className="dropdown-item">View Profile</Link>
                <Link to="/profile/edit" className="dropdown-item">Edit Profile</Link>
                <Link to="/applications" className="dropdown-item">Applications</Link>
                <Link to="/jobs/my-jobs" className="dropdown-item">My Job Postings</Link>
                <Link to="/jobs/saved" className="dropdown-item">Saved Jobs</Link>

                <hr />

                <button className="theme-toggle dropdown-item" onClick={toggleTheme}>
                  {isDarkMode ? 'Light Mode ☀️' : 'Dark Mode 🌙'}
                </button>

                <button className="logout-button dropdown-item" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;