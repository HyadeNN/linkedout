import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  // Handle load more
  const handleLoadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    event.preventDefault();
    await deleteNotification(notificationId);
  };

  // Get link based on notification type
  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'connection_request':
        return '/network';
      case 'connection_accepted':
        return `/users/${notification.created_by}`;
      case 'comment':
      case 'post_like':
        return `/posts/${notification.source_id}`;
      case 'new_post':
        return `/posts/${notification.source_id}`;
      case 'job_application':
        return `/jobs/${notification.source_id}`;
      default:
        return '/notifications';
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close notifications"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="notification-list">
        {loading && currentPage === 1 ? (
          <div className="notification-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet</div>
        ) : (
          notifications.map(notification => (
            <Link
              key={notification.id}
              to={getNotificationLink(notification)}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="notification-avatar">
                {notification.creator?.profile?.profile_image ? (
                  <img
                    src={notification.creator.profile.profile_image}
                    alt={`${notification.creator.first_name} ${notification.creator.last_name}`}
                  />
                ) : (
                  <div className="notification-icon">
                    {notification.type === 'connection_request' && '👥'}
                    {notification.type === 'connection_accepted' && '🤝'}
                    {notification.type === 'comment' && '💬'}
                    {notification.type === 'post_like' && '👍'}
                    {notification.type === 'new_post' && '📝'}
                    {notification.type === 'job_application' && '📋'}
                    {notification.type === 'application_status' && '📊'}
                  </div>
                )}
              </div>

              <div className="notification-content">
                <p className="notification-message">
                  {notification.message}
                </p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>

              <button
                className="delete-notification-btn"
                onClick={(e) => handleDeleteNotification(notification.id, e)}
                aria-label="Delete notification"
              >
                &times;
              </button>
            </Link>
          ))
        )}

        {hasMore && notifications.length > 0 && (
          <button
            className="load-more-btn"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>

      <div className="notification-footer">
        <Link to="/notifications" onClick={onClose}>
          View All Notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;