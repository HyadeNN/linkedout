import api, { getFormData } from './api';

// Get current user profile
export const getCurrentUserProfile = async () => {
  const response = await api.get('/profiles/me');
  return response.data;
};

// Create current user profile
export const createProfile = async (profileData) => {
  const response = await api.post('/profiles/me', profileData);
  return response.data;
};

// Update current user profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/profiles/me', profileData);
  return response.data;
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/profiles/me/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Upload cover image
export const uploadCoverImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/profiles/me/cover-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get user profile by user ID
export const getUserProfile = async (userId) => {
  const response = await api.get(`/profiles/users/${userId}`);
  return response.data;
};

// Get profile strength
export const getProfileStrength = async () => {
  const response = await api.get('/profiles/strength');
  return response.data;
};

// Create experience
export const createExperience = async (experienceData) => {
  const response = await api.post('/profiles/me/experiences', experienceData);
  return response.data;
};

// Update experience
export const updateExperience = async (experienceId, experienceData) => {
  const response = await api.put(`/profiles/me/experiences/${experienceId}`, experienceData);
  return response.data;
};

// Delete experience
export const deleteExperience = async (experienceId) => {
  const response = await api.delete(`/profiles/me/experiences/${experienceId}`);
  return response.data;
};

// Create education
export const createEducation = async (educationData) => {
  const response = await api.post('/profiles/me/educations', educationData);
  return response.data;
};

// Update education
export const updateEducation = async (educationId, educationData) => {
  const response = await api.put(`/profiles/me/educations/${educationId}`, educationData);
  return response.data;
};

// Delete education
export const deleteEducation = async (educationId) => {
  const response = await api.delete(`/profiles/me/educations/${educationId}`);
  return response.data;
};

// Create skill
export const createSkill = async (skillData) => {
  const response = await api.post('/profiles/me/skills', skillData);
  return response.data;
};

// Delete skill
export const deleteSkill = async (skillId) => {
  const response = await api.delete(`/profiles/me/skills/${skillId}`);
  return response.data;
};

// Endorse skill
export const endorseSkill = async (skillId) => {
  const response = await api.post(`/profiles/skills/${skillId}/endorse`);
  return response.data;
};

// Remove endorsement
export const removeEndorsement = async (skillId) => {
  const response = await api.delete(`/profiles/skills/${skillId}/endorse`);
  return response.data;
};