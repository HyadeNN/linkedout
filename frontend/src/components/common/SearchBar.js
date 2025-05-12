import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './Header.css';

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="nav-search-zone">
    <FaSearch className="nav-search-icon" />
    <input
      type="text"
      className="nav-search-input"
      placeholder={placeholder || 'Search'}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default SearchBar; 