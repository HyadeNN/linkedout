import api from './api';

// Get all notifications
export const getNotifications = async (page = 1, limit = 20) => {
  const response = await api.get('/notifications', {
    params: { page, limit },
  });
  return response.data;
};

// Get unread notifications count
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data.unread_count;
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await api.put('/notifications/mark-all-as-read');
  return response.data;
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};