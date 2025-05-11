import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../services';

const CreateJob = () => {
  const { jobId } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    job_type: 'full-time',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    is_remote: false
  });

  useEffect(() => {
    // If jobId is provided, we're in edit mode
    if (jobId) {
      setIsEditMode(true);
      fetchJobDetails(jobId);
    }
  }, [jobId]);

  const fetchJobDetails = async (id) => {
    try {
      setLoading(true);
      const jobData = await jobService.getJob(id);

      // Set form data from job
      setFormData({
        title: jobData.title || '',
        company_name: jobData.company_name || '',
        location: jobData.location || '',
        job_type: jobData.job_type || 'full-time',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        salary_min: jobData.salary_min || '',
        salary_max: jobData.salary_max || '',
        currency: jobData.currency || 'USD',
        is_remote: jobData.is_remote || false
      });
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      alert('Failed to load job details. Please try again.');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title || !formData.company_name || !formData.location || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode) {
        // Update existing job
        await jobService.updateJob(jobId, formData);
        alert('Job updated successfully!');
      } else {
        // Create new job
        await jobService.createJob(formData);
        alert('Job posted successfully!');
      }

      navigate('/jobs/my-jobs');
    } catch (error) {
      console.error('Failed to submit job:', error);
      alert(`Failed to ${isEditMode ? 'update' : 'post'} job. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading job details...</div>;
  }

  return (
    <div className="create-job-page">
      <div className="create-job-container">
        <h1 className="page-title">{isEditMode ? 'Edit Job' : 'Post a New Job'}</h1>

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-section">
            <h2 className="section-title">Job Details</h2>

            <div className="form-group">
              <label htmlFor="title">Job Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company_name">Company Name*</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. Acme Inc."
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location*</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="is_remote"
                name="is_remote"
                checked={formData.is_remote}
                onChange={handleChange}
                disabled={submitting}
              />
              <label htmlFor="is_remote">Remote Position</label>
            </div>

            <div className="form-group">
              <label htmlFor="job_type">Job Type*</label>
              <select
                id="job_type"
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Salary Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary_min">Minimum Salary</label>
                <input
                  type="number"
                  id="salary_min"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary_max">Maximum Salary</label>
                <input
                  type="number"
                  id="salary_max"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleChange}
                  placeholder="e.g. 80000"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Job Description and Requirements</h2>

            <div className="form-group">
              <label htmlFor="description">Job Description*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the responsibilities and details of the job..."
                rows={8}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List the skills, experience, and qualifications required..."
                rows={8}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/jobs/my-jobs')}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting
                ? (isEditMode ? 'Updating...' : 'Posting...')
                : (isEditMode ? 'Update Job' : 'Post Job')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;