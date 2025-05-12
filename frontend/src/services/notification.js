import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import api from './api';

// Get all notifications
export const getNotifications = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get unread notifications count
export const getUnreadCount = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
    readAt: serverTimestamp()
  });
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      isRead: true,
      readAt: serverTimestamp()
    });
  });
  
  await batch.commit();
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