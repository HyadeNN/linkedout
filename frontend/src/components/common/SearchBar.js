import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { postService } from '../../services';
import './Header.css';

const SearchBar = ({ value, onChange, placeholder, onResultSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const results = await postService.searchPosts(searchTerm);
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (onChange) onChange(e);
    setShowResults(true);
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    if (onResultSelect) onResultSelect(result);
  };

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="nav-search-zone" ref={searchRef} style={{ position: 'relative' }}>
      <FaSearch className="nav-search-icon" />
      <input
        type="text"
        className="nav-search-input"
        placeholder={placeholder || 'Search'}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
      />
      {loading && <div className="search-loading" style={{ position: 'absolute', right: 16, top: 12, fontSize: 14 }}>...</div>}
      {showResults && searchResults.length > 0 && (
        <div className="search-results" style={{ position: 'absolute', top: 48, left: 0, right: 0, background: '#fff', zIndex: 100, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              className="search-result-item"
              style={{ width: '100%', textAlign: 'left', padding: 12, border: 'none', background: 'none', cursor: 'pointer' }}
              onClick={() => handleResultClick(result)}
            >
              {result.type === 'hashtag' ? (
                <span style={{ color: '#0a66c2', fontWeight: 500 }}>#{result.value}</span>
              ) : (
                <div>
                  <div style={{ fontSize: 14, color: '#191919' }}>{result.content}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{result.author?.first_name} {result.author?.last_name}</div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 