import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUserProfile } from '../../services/profile';
import { connectionService } from '../../services';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaHashtag, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();
  const location = useLocation();

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

  // URL'den parametreleri al
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortParam = params.get('sort');
    
    if (sortParam) {
      setSortDirection(sortParam);
    }
  }, [location]);

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, orderBy('createdAt', sortDirection));
        const postsSnapshot = await getDocs(postsQuery);
        
        const hashtagCounts = {};
        postsSnapshot.docs.forEach(doc => {
          const hashtags = doc.data().hashtags || [];
          hashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        });

        const sortedHashtags = Object.entries(hashtagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 hashtags

        setTrendingHashtags(sortedHashtags);
      } catch (error) {
        console.error('Error fetching trending hashtags:', error);
      }
    };

    fetchTrendingHashtags();
  }, [sortDirection]); // sortDirection değiştiğinde yeniden çek

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newDirection);
    
    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('sort', newDirection);
    navigate(`?${params.toString()}`);
  };

  const handleHashtagClick = (hashtag) => {
    const tagName = hashtag.replace(/^#/, '');
    const params = new URLSearchParams(location.search);
    params.set('hashtag', tagName);
    navigate(`?${params.toString()}`);
  };

  if (loading) {
    return <div className="sidebar skeleton-sidebar"></div>;
  }

  return (
    <aside className="sidebar sidebar-modern sticky-sidebar">
      <div className="recent-card modern-card long-card">
        <div className="trending-hashtags">
          <div className="hashtags-header">
            <h3>Popular Hashtags</h3>
            <button onClick={toggleSortDirection} className="sort-button">
              {sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
            </button>
          </div>
          <div className="hashtag-list">
            {trendingHashtags.map((hashtag, index) => (
              <button
                key={index}
                className="hashtag-button"
                onClick={() => handleHashtagClick(hashtag.name)}
              >
                <FaHashtag className="hashtag-icon" />
                <span>{hashtag.name.replace('#', '')}</span>
                <span className="hashtag-count">{hashtag.count} posts</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;