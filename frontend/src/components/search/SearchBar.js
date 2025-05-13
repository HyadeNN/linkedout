import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services';

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const searchPosts = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const results = await postService.searchPosts(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    if (result.type === 'hashtag') {
      navigate(`/feed?hashtag=${encodeURIComponent(result.value)}`);
    } else {
      navigate(`/posts/${result.id}`);
    }
  };

  const handleClickOutside = (e) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-container" ref={searchContainerRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search posts, hashtags..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {loading && <div className="search-loading">Searching...</div>}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result, index) => (
            <button
              key={index}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              {result.type === 'hashtag' ? (
                <span className="hashtag-result">#{result.value}</span>
              ) : (
                <div className="post-result">
                  <p className="post-preview">{result.content}</p>
                  <span className="post-meta">
                    {result.author?.first_name} {result.author?.last_name} •{' '}
                    {new Date(result.created_at).toLocaleDateString()}
                  </span>
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