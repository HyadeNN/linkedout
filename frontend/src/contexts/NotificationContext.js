import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notification';

// Create Notification Context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      // Set up interval to check for new notifications
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.uid);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );

      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);

      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      setNotifications(updatedNotifications);

      // Update unread count if needed
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    setUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
};

export default NotificationContext;