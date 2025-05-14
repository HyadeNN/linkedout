import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaRss, FaUserFriends, FaBriefcase, FaSearch } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import NavigationMenu from './NavigationMenu';
import ProfileInfo from './ProfileInfo';
import ProfileOther from './ProfileOther';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { postService } from '../../services';
import './Header.css';

const navItems = [
  { name: 'Feed', icon: <FaRss />, path: '/' },
  { name: 'Network', icon: <FaUserFriends />, path: '/network' },
  { name: 'Jobs', icon: <FaBriefcase />, path: '/jobs' },
];

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const results = await postService.searchPosts(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setShowResults(false);
    if (searchTerm.startsWith('#')) {
      const hashtag = searchTerm.substring(1);
      navigate(`/?hashtag=${encodeURIComponent(hashtag)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
    setSearchTerm('');
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    
    if (result.matchType === 'hashtag') {
      const hashtag = result.hashtags[0].replace('#', '');
      navigate(`/?hashtag=${encodeURIComponent(hashtag)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(result.content)}`);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.nav-search-zone')) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="nav-header">
      <Logo />
      <NavigationMenu navItems={navItems} />
      <div className="nav-search-zone">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="nav-search-icon" />
            <input
              type="text"
              className="nav-search-input"
              placeholder="Gönderi veya hashtag ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {loading && <div className="search-loading">...</div>}
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.slice(0, 5).map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  {result.matchType === 'hashtag' ? (
                    <div className="hashtag-result">
                      <span className="hashtag-icon">#</span>
                      <span>{result.hashtags[0].replace('#', '')}</span>
                    </div>
                  ) : (
                    <div className="result-content">
                      <img
                        src={result.user.profile.profile_image || '/default-avatar.jpg'}
                        alt={result.user.name}
                        className="result-avatar"
                      />
                      <div className="result-text">
                        <div className="result-name">{result.user.name}</div>
                        <div className="result-preview">
                          {result.content.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {searchResults.length > 5 && (
                <div
                  className="search-result-item view-all"
                  onClick={() => {
                    setShowResults(false);
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                    setSearchTerm('');
                  }}
                >
                  <span>Tüm sonuçları görüntüle ({searchResults.length})</span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      <div className="nav-profile-zone">
        <ProfileInfo user={{ ...user, profile: currentUserProfile }} />
        <ProfileOther />
      </div>
    </header>
  );
};

export default Header;