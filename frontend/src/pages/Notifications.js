import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../services';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page);

      if (page === 1) {
        setNotifications(response.items);
      } else {
        setNotifications(prevNotifications => [...prevNotifications, ...response.items]);
      }

      setTotalNotifications(response.total);
      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      setActionLoading(true);
      await notificationService.deleteNotification(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      setTotalNotifications(prevTotal => prevTotal - 1);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete all notifications
  const handleDeleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        setActionLoading(true);
        await notificationService.deleteAllNotifications();

        // Update local state
        setNotifications([]);
        setTotalNotifications(0);
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'connection_request':
        navigate('/network');
        break;
      case 'connection_accepted':
        navigate(`/users/${notification.created_by}`);
        break;
      case 'post_like':
      case 'comment':
      case 'new_post':
        navigate(`/posts/${notification.source_id}`);
        break;
      case 'job_application':
      case 'application_status':
        navigate(`/jobs/${notification.source_id}`);
        break;
      default:
        navigate('/notifications');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return '👥';
      case 'connection_accepted':
        return '🤝';
      case 'post_like':
        return '👍';
      case 'comment':
        return '💬';
      case 'new_post':
        return '📝';
      case 'job_application':
        return '📋';
      case 'application_status':
        return '📊';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="page-title">Notifications</h1>

        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
            >
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              className="delete-all-btn"
              onClick={handleDeleteAllNotifications}
              disabled={actionLoading}
            >
              Delete all
            </button>
          )}
        </div>
      </div>

      <div className="notifications-content">
        {loading && notifications.length === 0 ? (
          <div className="loading-indicator">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <h3>No notifications yet</h3>
            <p>When you have new notifications, you'll see them here.</p>
          </div>
        ) : (
          <>
            <div className="notifications-list">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.creator?.profile?.profile_image ? (
                      <img
                        src={notification.creator.profile.profile_image}
                        alt={`${notification.creator.first_name} ${notification.creator.last_name}`}
                        className="creator-avatar"
                      />
                    ) : (
                      <div className="icon-placeholder">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  <div className="notification-content">
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <p className="notification-time">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={actionLoading}
                      >
                        Mark as read
                      </button>
                    )}

                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;