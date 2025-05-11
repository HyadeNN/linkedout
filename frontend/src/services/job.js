import api from './api';

// Create a job posting
export const createJob = async (jobData) => {
  const response = await api.post('/jobs', jobData);
  return response.data;
};

// Update a job posting
export const updateJob = async (jobId, jobData) => {
  const response = await api.put(`/jobs/${jobId}`, jobData);
  return response.data;
};

// Delete a job posting
export const deleteJob = async (jobId) => {
  const response = await api.delete(`/jobs/${jobId}`);
  return response.data;
};

// Get a job by ID
export const getJob = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

// Get all active jobs
export const getJobs = async (page = 1, limit = 20) => {
  const response = await api.get('/jobs', {
    params: { page, limit },
  });
  return response.data;
};

// Get jobs posted by current user
export const getMyJobPostings = async (page = 1, limit = 20) => {
  const response = await api.get('/jobs/my-postings', {
    params: { page, limit },
  });
  return response.data;
};

// Search jobs
export const searchJobs = async (filters, page = 1, limit = 20) => {
  const response = await api.get('/jobs/search', {
    params: {
      ...filters,
      page,
      limit,
    },
  });
  return response.data;
};

// Apply for a job
export const applyForJob = async (jobId, coverLetter = '') => {
  const response = await api.post('/jobs/apply', {
    job_id: jobId,
    cover_letter: coverLetter,
  });
  return response.data;
};

// Update job application status
export const updateApplicationStatus = async (applicationId, status) => {
  const response = await api.put(`/jobs/applications/${applicationId}`, { status });
  return response.data;
};

// Get job applications
export const getJobApplications = async (jobId, page = 1, limit = 20) => {
  const response = await api.get(`/jobs/${jobId}/applications`, {
    params: { page, limit },
  });
  return response.data;
};

// Get my job applications
export const getMyApplications = async (page = 1, limit = 20) => {
  const response = await api.get('/jobs/my-applications', {
    params: { page, limit },
  });
  return response.data;
};

// Save a job
export const saveJob = async (jobId) => {
  const response = await api.post('/jobs/save', { job_id: jobId });
  return response.data;
};

// Remove a saved job
export const removeSavedJob = async (jobId) => {
  const response = await api.delete(`/jobs/save/${jobId}`);
  return response.data;
};

// Get saved jobs
export const getSavedJobs = async (page = 1, limit = 20) => {
  const response = await api.get('/jobs/saved', {
    params: { page, limit },
  });
  return response.data;
};

// Check if job is saved
export const isJobSaved = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/is-saved`);
  return response.data.is_saved;
};

// Check if job is applied
export const isJobApplied = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/is-applied`);
  return response.data.is_applied;
};