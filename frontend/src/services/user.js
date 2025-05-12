import api from './api';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Get current user
export const getCurrentUserProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Update current user
export const updateCurrentUser = async (userData) => {
  const response = await api.put('/users/me', userData);

  // Update user in local storage
  const user = response.data;
  localStorage.setItem('user', JSON.stringify(user));

  return user;
};

// Update password
export const updatePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/users/me/password', null, {
    params: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
  return response.data;
};

// Deactivate account
export const deactivateAccount = async () => {
  const response = await api.delete('/users/me');

  // Remove user from local storage
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');

  return response.data;
};

// Get user by ID from Firestore
export const getUserById = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  const data = userSnap.data();
  return {
    id: userSnap.id,
    ...data,
    profile: data.profile || {},
  };
};

// Search users
export const searchUsers = async (query, page = 1, limit = 20) => {
  const response = await api.get('/users', {
    params: {
      query,
      page,
      limit,
    },
  });
  return response.data;
};