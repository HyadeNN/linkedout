import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './Header.css';

const ProfileInfo = ({ user, stats }) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  return (
    <div className="nav-profile-info">
      <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
        <div className={`nav-profile-avatar ${!userProfile?.profile?.profile_image ? 'nav-profile-avatar-empty' : ''}`}>
          {userProfile?.profile?.profile_image && (
            <img 
              src={userProfile.profile.profile_image}
              alt={userProfile?.name || 'User'}
              className="nav-profile-image"
            />
          )}
        </div>
        <div className="nav-profile-texts">
          <div className="nav-profile-name-row">
            <span className="nav-profile-name">{userProfile?.name || user?.displayName || 'User Name'}</span>
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
};

export default ProfileInfo; 