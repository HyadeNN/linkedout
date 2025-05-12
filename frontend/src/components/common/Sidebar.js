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
    <aside className="sidebar sidebar-modern sticky-sidebar">
      <div className="recent-card modern-card long-card">
        <h3>Recent</h3>
        <ul className="recent-list long-list">
          <li><a href="#">#javascript</a></li>
          <li><a href="#">#react</a></li>
          <li><a href="#">#firebase</a></li>
          <li><a href="#">Remote Jobs</a></li>
          <li><a href="#">Full Stack Development</a></li>
          <li><a href="#">Web Design</a></li>
          <li><a href="#">Product Management</a></li>
          <li><a href="#">AI & ML</a></li>
          <li><a href="#">Cloud Computing</a></li>
          <li><a href="#">Career Advice</a></li>
        </ul>
        <div className="groups-section">
          <h3>Groups</h3>
          <ul className="groups-list long-list">
            <li><a href="#">Python Developers</a></li>
            <li><a href="#">UX/UI Design Professionals</a></li>
            <li><a href="#">React Community</a></li>
            <li><a href="#">Frontend Masters</a></li>
            <li><a href="#">Remote Workers</a></li>
            <li><a href="#">Women in Tech</a></li>
            <li><a href="#">Startup Founders</a></li>
            <li><a href="#">Product Designers</a></li>
            <li><a href="#">Web3 Enthusiasts</a></li>
            <li><a href="#">Community Leaders</a></li>
          </ul>
        </div>
        <a href="#" className="discover-more">Discover More</a>
      </div>
    </aside>
  );
};

export default Sidebar;