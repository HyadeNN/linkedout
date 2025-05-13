import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaRss, FaUserFriends, FaBriefcase, FaCommentDots, FaBell } from 'react-icons/fa';
import Logo from './Logo';
import NavigationMenu from './NavigationMenu';
import SearchBar from './SearchBar';
import ProfileInfo from './ProfileInfo';
import ProfileOther from './ProfileOther';
import './Header.css';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const navItems = [
  { name: 'Feed', icon: <FaRss />, path: '/' },
  { name: 'Network', icon: <FaUserFriends />, path: '/network' },
  { name: 'Jobs', icon: <FaBriefcase />, path: '/jobs' },
  { name: 'Chat', icon: <FaCommentDots />, path: '/chat' },
  { name: 'Notices', icon: <FaBell />, path: '/notices' },
];

const Header = ({ onSearchResult }) => {
  const { user } = useAuth();
  const [profileStats, setProfileStats] = useState({ viewsToday: 367, viewsChange: 32 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch current user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUserProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  const handleResultSelect = (result) => {
    if (result.type === 'hashtag') {
      if (onSearchResult) onSearchResult({ hashtag: result.value });
      navigate('/');
    } else if (result.type === 'post') {
      navigate(`/posts/${result.id}`);
    }
  };

  return (
    <header className="nav-header">
      <Logo />
      <NavigationMenu navItems={navItems} />
      <SearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onResultSelect={handleResultSelect} />
      <div className="nav-profile-zone">
        <ProfileInfo user={{ ...user, profile: currentUserProfile }} stats={profileStats} />
        <ProfileOther />
      </div>
    </header>
  );
};

export default Header;