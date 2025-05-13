import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisH } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const ProfileOther = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="nav-profile-other" ref={dropdownRef}>
      <div className="nav-profile-other-button" onClick={() => setIsOpen(!isOpen)}>
        <FaEllipsisH className="nav-profile-other-icon" />
        <span className="nav-profile-other-label">OTHER</span>
      </div>
      {isOpen && (
        <div className="nav-profile-dropdown">
          <button 
            className="nav-profile-dropdown-item"
            onClick={() => {
              navigate('/profile/settings');
              setIsOpen(false);
            }}
          >
            Profile Settings
          </button>
          <button 
            className="nav-profile-dropdown-item"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileOther; 