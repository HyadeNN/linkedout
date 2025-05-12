import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/common/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/common/Sidebar';
import NotificationPanel from '../components/common/NotificationPanel';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotification();
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    fetchUnreadCount();
  }, [location]);

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setShowNotifications(prev => !prev);
  };

  return (
    <div className="main-layout">
      <Header
        user={user}
        unreadCount={unreadCount}
        toggleNotificationPanel={toggleNotificationPanel}
        isDarkMode={theme === 'dark'}
        toggleTheme={toggleTheme}
      />

      <div className="main-container">
        <Sidebar />

        <main className="content">
          {children}
        </main>

        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;