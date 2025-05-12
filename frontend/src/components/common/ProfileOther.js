import React from 'react';
import { FaEllipsisH } from 'react-icons/fa';
import './Header.css';

const ProfileOther = () => (
  <div className="nav-profile-other">
    <FaEllipsisH className="nav-profile-other-icon" />
    <span className="nav-profile-other-label">OTHER</span>
  </div>
);

export default ProfileOther; 