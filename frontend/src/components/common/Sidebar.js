import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUserProfile } from '../../services/profile';
import { connectionService } from '../../services';

const Sidebar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        const profileData = await getCurrentUserProfile();
        setProfile(profileData);
        // Fetch connection count
        const connectionsData = await connectionService.getConnections(1, 1);
        setConnectionCount(connectionsData.total);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return <div className="sidebar skeleton-sidebar"></div>;
  }

  return (
    <aside className="sidebar">
      <div className="profile-card">
        <div className="profile-cover">
          <img
            src={profile?.cover_image || '/default-cover.jpg'}
            alt="Cover"
            className="cover-image"
          />
        </div>
        <div className="profile-details">
          <div className="profile-avatar">
            <img
              src={profile?.profile_image || '/default-avatar.jpg'}
              alt={`${user?.first_name} ${user?.last_name}`}
              className="avatar-image"
            />
          </div>
          <h2 className="profile-name">
            <Link to="/profile">{user?.first_name} {user?.last_name}</Link>
          </h2>
          <p className="profile-headline">{profile?.headline || 'No headline set'}</p>
        </div>
        <div className="profile-stats">
          <div className="stats-item">
            <span className="stats-label">Profile views</span>
            <span className="stats-value">147</span>
          </div>
          <div className="stats-item">
            <Link to="/network" className="stats-label">Connections</Link>
            <span className="stats-value">{connectionCount}</span>
          </div>
          <div className="stats-item">
            <span className="stats-label">Post impressions</span>
            <span className="stats-value">632</span>
          </div>
        </div>
        <div className="profile-actions">
          <Link to="/profile" className="view-profile-btn">View Profile</Link>
        </div>
      </div>
      <div className="recent-card">
        <h3>Recent</h3>
        <ul className="recent-list">
          <li><a href="#">#javascript</a></li>
          <li><a href="#">Remote Jobs</a></li>
          <li><a href="#">Full Stack Development</a></li>
          <li><a href="#">Web Design</a></li>
          <li><a href="#">Product Management</a></li>
        </ul>
        <div className="groups-section">
          <h3>Groups</h3>
          <ul className="groups-list">
            <li><a href="#">Python Developers</a></li>
            <li><a href="#">UX/UI Design Professionals</a></li>
            <li><a href="#">React Community</a></li>
          </ul>
        </div>
        <a href="#" className="discover-more">Discover More</a>
      </div>
    </aside>
  );
};

export default Sidebar;