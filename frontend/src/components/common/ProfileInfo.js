import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import './Header.css';

const ProfileInfo = ({ user, stats }) => (
  <div className="nav-profile-info">
    <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
      {user?.profile?.profile_image || user?.photoURL ? (
        <img
          src={user?.profile?.profile_image || user?.photoURL}
          alt={user?.displayName || 'User'}
          className="nav-profile-avatar"
        />
      ) : (
        <div className="nav-profile-avatar nav-profile-avatar-empty"></div>
      )}
      <div className="nav-profile-texts">
        <div className="nav-profile-name-row">
          <span className="nav-profile-name">{user?.displayName || 'User Name'}</span>
          <span className="nav-profile-you">YOU</span>
        </div>
        <div className="nav-profile-stats-row">
          <span className="nav-profile-views">{stats?.viewsToday || 0} views today</span>
          <span className="nav-profile-views-change">+{stats?.viewsChange || 0} <FiArrowUpRight /></span>
        </div>
      </div>
    </Link>
  </div>
);

export default ProfileInfo; 