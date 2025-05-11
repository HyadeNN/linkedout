import api from './api';

// Create connection request
export const createConnectionRequest = async (receiverId) => {
  const response = await api.post('/connections/request', { receiver_id: receiverId });
  return response.data;
};

// Update connection status (accept/reject)
export const updateConnectionStatus = async (connectionId, status) => {
  const response = await api.put(`/connections/${connectionId}`, { status });
  return response.data;
};

// Delete connection or withdraw request
export const deleteConnection = async (connectionId) => {
  const response = await api.delete(`/connections/${connectionId}`);
  return response.data;
};

// Get all connections
export const getConnections = async (page = 1, limit = 20) => {
  const response = await api.get('/connections', {
    params: { page, limit },
  });
  return response.data;
};

// Get connection requests
export const getConnectionRequests = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/requests', {
    params: { page, limit },
  });
  return response.data;
};

// Get sent connection requests
export const getSentConnectionRequests = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/sent-requests', {
    params: { page, limit },
  });
  return response.data;
};

// Get connection suggestions
export const getConnectionSuggestions = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/suggestions', {
    params: { page, limit },
  });
  return response.data;
};

// Check connection status with another user
export const checkConnectionStatus = async (userId) => {
  const response = await api.get(`/connections/status/${userId}`);
  return response.data;
};

// Get mutual connections
export const getMutualConnections = async (userId, page = 1, limit = 20) => {
  const response = await api.get(`/connections/mutual/${userId}`, {
    params: { page, limit },
  });
  return response.data;
};

// Follow a user
export const followUser = async (userId) => {
  const response = await api.post('/connections/follow', { followed_id: userId });
  return response.data;
};

// Unfollow a user
export const unfollowUser = async (userId) => {
  const response = await api.delete(`/connections/follow/${userId}`);
  return response.data;
};

// Get followers
export const getFollowers = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/followers', {
    params: { page, limit },
  });
  return response.data;
};

// Get following
export const getFollowing = async (page = 1, limit = 20) => {
  const response = await api.get('/connections/following', {
    params: { page, limit },
  });
  return response.data;
};

// Check if following a user
export const isFollowingUser = async (userId) => {
  const response = await api.get(`/connections/is-following/${userId}`);
  return response.data;
};