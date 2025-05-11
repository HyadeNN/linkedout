import api, { getFormData } from './api';

// Create a post
export const createPost = async (content, image = null) => {
  const formData = new FormData();
  formData.append('content', content);

  if (image) {
    formData.append('image', image);
  }

  const response = await api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update a post
export const updatePost = async (postId, content) => {
  const response = await api.put(`/posts/${postId}`, { content });
  return response.data;
};

// Delete a post
export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

// Get a post by ID
export const getPost = async (postId) => {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
};

// Get feed posts
export const getFeedPosts = async (page = 1, limit = 20) => {
  const response = await api.get('/posts', {
    params: { page, limit },
  });
  return response.data;
};

// Get user posts
export const getUserPosts = async (userId, page = 1, limit = 20) => {
  const response = await api.get(`/posts/user/${userId}`, {
    params: { page, limit },
  });
  return response.data;
};

// Search posts
export const searchPosts = async (query, page = 1, limit = 20) => {
  const response = await api.get('/posts/search', {
    params: { query, page, limit },
  });
  return response.data;
};

// Create a comment
export const createComment = async (postId, content) => {
  const response = await api.post(`/posts/${postId}/comments`, {
    post_id: postId,
    content,
  });
  return response.data;
};

// Update a comment
export const updateComment = async (commentId, content) => {
  const response = await api.put(`/posts/comments/${commentId}`, { content });
  return response.data;
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/posts/comments/${commentId}`);
  return response.data;
};

// Get post comments
export const getPostComments = async (postId, page = 1, limit = 50) => {
  const response = await api.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });
  return response.data;
};

// Like a post
export const likePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

// Unlike a post
export const unlikePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}/like`);
  return response.data;
};

// Like a comment
export const likeComment = async (commentId) => {
  const response = await api.post(`/posts/comments/${commentId}/like`);
  return response.data;
};

// Unlike a comment
export const unlikeComment = async (commentId) => {
  const response = await api.delete(`/posts/comments/${commentId}/like`);
  return response.data;
};

// Get post likes
export const getPostLikes = async (postId, page = 1, limit = 50) => {
  const response = await api.get(`/posts/${postId}/likes`, {
    params: { page, limit },
  });
  return response.data;
};

// Get comment likes
export const getCommentLikes = async (commentId, page = 1, limit = 50) => {
  const response = await api.get(`/posts/comments/${commentId}/likes`, {
    params: { page, limit },
  });
  return response.data;
};

// Check if post is liked
export const isPostLiked = async (postId) => {
  const response = await api.get(`/posts/${postId}/is-liked`);
  return response.data.is_liked;
};