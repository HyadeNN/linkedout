import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const JobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const jobData = await jobService.getJob(jobId);
        setJob(jobData);
        setIsSaved(jobData.is_saved);
        setIsApplied(jobData.is_applied);
      } catch (error) {
        console.error('Failed to fetch job:', error);
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // Handle apply
  const handleApply = async (e) => {
    e.preventDefault();

    try {
      setApplying(true);
      await jobService.applyForJob(jobId, coverLetter);
      setIsApplied(true);
      setShowApplyForm(false);
      alert('Your application has been submitted successfully!');
    } catch (error) {
      console.error('Failed to apply for job:', error);
      alert('Failed to apply for job. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Handle save/unsave job
  const handleToggleSave = async () => {
    try {
      setSaving(true);

      if (isSaved) {
        await jobService.removeSavedJob(jobId);
        setIsSaved(false);
      } else {
        await jobService.saveJob(jobId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save/unsave job:', error);
      alert('Failed to save/unsave job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading job details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to="/jobs" className="back-link">Back to Jobs</Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="error-container">
        <p className="error-message">Job not found.</p>
        <Link to="/jobs" className="back-link">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <div className="job-header">
          <div className="job-title-section">
            <h1 className="job-title">{job.title}</h1>
            <p className="job-company">{job.company_name}</p>
            <p className="job-location">
              {job.location} {job.is_remote && '(Remote)'}
            </p>
            <p className="job-posted">
              Posted by {job.poster?.first_name} {job.poster?.last_name}
            </p>
          </div>

          <div className="job-actions">
            {!isApplied ? (
              <button
                className="apply-button"
                onClick={() => setShowApplyForm(true)}
                disabled={applying}
              >
                Apply Now
              </button>
            ) : (
              <button className="applied-button" disabled>
                Applied
              </button>
            )}

            <button
              className={`save-button ${isSaved ? 'saved' : ''}`}
              onClick={handleToggleSave}
              disabled={saving}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>

            {job.poster_id === user?.id && (
              <button
                className="edit-button"
                onClick={() => navigate(`/jobs/edit/${jobId}`)}
              >
                Edit Job
              </button>
            )}
          </div>
        </div>

        <div className="job-details">
          <div className="job-info">
            <div className="info-item">
              <span className="info-label">Job Type:</span>
              <span className="info-value">{job.job_type}</span>
            </div>

            {(job.salary_min || job.salary_max) && (
              <div className="info-item">
                <span className="info-label">Salary:</span>
                <span className="info-value">
                  {job.salary_min && job.salary_max
                    ? `${job.salary_min} - ${job.salary_max} ${job.currency}`
                    : job.salary_min
                    ? `From ${job.salary_min} ${job.currency}`
                    : `Up to ${job.salary_max} ${job.currency}`}
                </span>
              </div>
            )}
          </div>

          <div className="job-section">
            <h2 className="section-title">Description</h2>
            <div className="section-content">
              <p>{job.description}</p>
            </div>
          </div>

          {job.requirements && (
            <div className="job-section">
              <h2 className="section-title">Requirements</h2>
              <div className="section-content">
                <p>{job.requirements}</p>
              </div>
            </div>
          )}
        </div>

        {showApplyForm && (
          <div className="apply-form-container">
            <h2 className="form-title">Apply for {job.title}</h2>

            <form onSubmit={handleApply} className="apply-form">
              <div className="form-group">
                <label htmlFor="cover-letter">Cover Letter (Optional)</label>
                <textarea
                  id="cover-letter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the employer why you're a good fit for this role..."
                  rows={8}
                  disabled={applying}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowApplyForm(false)}
                  disabled={applying}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={applying}
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;