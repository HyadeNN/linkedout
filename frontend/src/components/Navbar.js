import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserData } from '../services/user';
import { postService } from '../services';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const data = await getCurrentUserData(currentUser.uid);
          console.log("Firebase user data:", data);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    if (searchTerm.startsWith('#')) {
      // Hashtag araması
      const hashtag = searchTerm.substring(1);
      window.location.href = `/?hashtag=${encodeURIComponent(hashtag)}`;
    } else {
      // Normal arama
      window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
    }
    setSearchResults([]);
    setShowResults(false);
    setSearchTerm('');
  };

  const handleResultClick = (result) => {
    if (result.matchType === 'hashtag') {
      const hashtag = result.hashtags[0].replace('#', '');
      window.location.href = `/?hashtag=${encodeURIComponent(hashtag)}`;
    } else {
      // Post detay sayfasına yönlendir
      window.location.href = `/post/${result.id}`;
    }
    setSearchResults([]);
    setShowResults(false);
    setSearchTerm('');
  };

  // URL değişikliklerini izle
  useEffect(() => {
    console.log('Current location:', location.pathname + location.search);
  }, [location]);

  // Arama işlemi için debounce fonksiyonu
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        console.log('Performing search for:', searchTerm);
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = async () => {
    try {
      const results = await postService.searchPosts(searchTerm);
      console.log('Search results:', results);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Debug için eklendi
  useEffect(() => {
    console.log("Current userData state:", userData);
  }, [userData]);

  useEffect(() => {
    console.log("Search Results:", searchResults);
  }, [searchResults]);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600">
              LinkedOut
            </Link>
            <div className="search-container">
              <form onSubmit={handleSearchSubmit} className="search-form">
                <input
                  type="text"
                  className="nav-search-input"
                  placeholder="Hashtag için # kullanın veya içerik arayın"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowResults(true)}
                />
                <button type="submit" className="search-button">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
              </form>
              {showResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="search-result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="result-content">
                        {result.matchType === 'hashtag' ? (
                          <div className="hashtag-result">
                            <span className="hashtag-icon">#</span>
                            {result.hashtags[0].replace('#', '')}
                          </div>
                        ) : (
                          <>
                            <img
                              src={result.user.profile.profile_image || '/default-avatar.jpg'}
                              alt={result.user.name}
                              className="result-avatar"
                            />
                            <div className="result-text">
                              <div className="result-name">{result.user.name}</div>
                              <div className="result-preview">{result.content.substring(0, 100)}...</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/feed" className="nav-link">Feed</Link>
              <Link to="/network" className="nav-link">Network</Link>
              <Link to="/jobs" className="nav-link">Jobs</Link>
              <Link to="/chat" className="nav-link">Chat</Link>
            </div>
          </div>

          <div className="nav-profile-zone">
            <div className="nav-profile-info">
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div className={`nav-profile-avatar ${!userData?.profile?.profile_image ? 'nav-profile-avatar-empty' : ''}`}>
                  {userData?.profile?.profile_image && (
                    <img 
                      src={userData.profile.profile_image}
                      alt={userData?.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="nav-profile-texts">
                  <div className="nav-profile-name-row">
                    <span className="nav-profile-name">{userData?.name}</span>
                    <span className="nav-profile-you">YOU</span>
                  </div>
                  <div className="nav-profile-stats-row">
                    <span className="nav-profile-views">367 views today</span>
                    <span className="nav-profile-views-change">
                      +32 
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
            <div className="nav-profile-other">
              <div className="nav-profile-other-button">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="nav-profile-other-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path>
                </svg>
                <span className="nav-profile-other-label">OTHER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 