import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserData } from '../services/user';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, signOut } = useAuth();
  const [userData, setUserData] = useState(null);

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

  // Debug için eklendi
  useEffect(() => {
    console.log("Current userData state:", userData);
  }, [userData]);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600">
              LinkedOut
            </Link>
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