import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services';
import { JOB_TYPES, JOB_CATEGORIES, JOB_STATUS } from '../../models/JobModel';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import ApplicationForm from './ApplicationForm';
import './JobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const { user, isEmployer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load job posting
  useEffect(() => {
    const fetchJob = async () => {
      console.log("Fetching job details for job ID:", jobId);
      try {
        setLoading(true);
        const jobData = await jobService.getJob(jobId);
        console.log("Job data loaded:", jobData);
        setJob(jobData);

        // Increment view count (only for job seekers)
        if (!isEmployer() && isAuthenticated()) {
          console.log("Incrementing view count");
          await jobService.incrementJobViews(jobId);
        }

        // Check if user has already applied to this job
        if (isAuthenticated() && !isEmployer() && user) {
          console.log("Checking if user has already applied");
          const applications = await jobService.getApplications({ 
            jobId, 
            userId: user.uid 
          });
          console.log("User applications:", applications);
          setHasApplied(applications.length > 0);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('An error occurred while loading the job. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, isEmployer, isAuthenticated, user]);

  // Navigate to edit job page
  const handleEditJob = () => {
    navigate(`/jobs/edit/${jobId}`);
  };

  // Delete job
  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await jobService.deleteJob(jobId);
      navigate('/jobs/my-jobs');
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('An error occurred while deleting the job. Please try again later.');
    }
  };

  // Show/hide application form
  const toggleApplicationForm = () => {
    console.log("Toggle application form clicked");
    console.log("isAuthenticated:", isAuthenticated());
    console.log("Current user:", user);
    
    if (!isAuthenticated()) {
      console.log("User not authenticated, redirecting to login");
      navigate('/auth/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }

    console.log("Setting showApplicationForm to:", !showApplicationForm);
    setShowApplicationForm(!showApplicationForm);
  };

  // When application is submitted
  const handleApplicationSubmit = () => {
    setShowApplicationForm(false);
    setHasApplied(true);
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <Header />
        <div className="container">
          <div className="error-message">
            {error || 'Job not found.'}
          </div>
          <Link to="/jobs" className="btn-secondary">
            Back to Job Listings
          </Link>
        </div>
      </div>
    );
  }

  // Is the current user the owner of this job?
  const isOwner = user && job.employerId === user.uid;

  // Is the job status active?
  const isActive = job.status === 'active';

  return (
    <div className="job-detail-page">
      <Header />
      <div className="container">
        <div className="job-detail-header">
          <div>
            <h1>{job.title}</h1>
            <div className="job-company-info">
              <span className="job-company">{job.company}</span>
              <span className="job-location">📍 {job.location}</span>
            </div>
          </div>
          
          <div className="job-actions">
            {isOwner ? (
              <>
                <button className="btn-secondary" onClick={handleEditJob}>
                  Edit
                </button>
                <button className="btn-danger" onClick={handleDeleteJob}>
                  Delete
                </button>
              </>
            ) : !isEmployer() && isActive && (
              <button 
                className={`btn-primary ${hasApplied ? 'applied' : ''}`} 
                onClick={toggleApplicationForm}
                disabled={hasApplied}
              >
                {hasApplied ? 'Applied' : 'Apply'}
              </button>
            )}
          </div>
        </div>
        
        <div className="job-status-bar">
          <div className="job-status-item">
            <span className="status-label">Status:</span>
            <span className={`status-badge status-${job.status}`}>
              {JOB_STATUS.find(s => s.id === job.status)?.label || job.status}
            </span>
          </div>
          <div className="job-status-item">
            <span className="status-label">Job Type:</span>
            <span className="status-value">
              {JOB_TYPES.find(t => t.id === job.type)?.label || job.type}
            </span>
          </div>
          <div className="job-status-item">
            <span className="status-label">Category:</span>
            <span className="status-value">
              {JOB_CATEGORIES.find(c => c.id === job.category)?.label || job.category}
            </span>
          </div>
          {job.deadline && (
            <div className="job-status-item">
              <span className="status-label">Application Deadline:</span>
              <span className="status-value">
                {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {job.salary && job.salary.min > 0 && (
          <div className="job-salary-section">
            <h3>Salary Range</h3>
            <div className="job-salary">
              {job.salary.min} - {job.salary.max} {job.salary.currency}
            </div>
          </div>
        )}
        
        <div className="job-description-section">
          <h3>Job Description</h3>
          <div className="job-description">
            {job.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
        
        {job.requirements && job.requirements.length > 0 && (
          <div className="job-requirements-section">
            <h3>Requirements</h3>
            <ul className="job-requirements">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {job.skills && job.skills.length > 0 && (
          <div className="job-skills-section">
            <h3>Required Skills</h3>
            <div className="job-skills">
              {job.skills.map((skill, index) => (
                <span key={index} className="job-skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="job-footer">
          <div className="job-stats">
            <div className="job-stat-item">
              <span className="stat-label">Posted:</span>
              <span className="stat-value">
                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="job-stat-item">
              <span className="stat-label">Views:</span>
              <span className="stat-value">{job.viewCount || 0}</span>
            </div>
            <div className="job-stat-item">
              <span className="stat-label">Applications:</span>
              <span className="stat-value">{job.applicationCount || 0}</span>
            </div>
          </div>
          
          <div className="job-footer-actions">
            <Link to="/jobs" className="btn-secondary">
              Back to Job Listings
            </Link>
          </div>
        </div>
        
        {/* Debug panel */}
        <div style={{background: '#f0f0f0', padding: '10px', margin: '20px 0', borderRadius: '4px'}}>
          <h4>Debug Panel (will be removed)</h4>
          <p>Job ID: {jobId}</p>
          <p>User ID: {user?.uid || 'Not logged in'}</p>
          <p>showApplicationForm: {showApplicationForm ? 'true' : 'false'}</p>
          <p>hasApplied: {hasApplied ? 'true' : 'false'}</p>
          <p>isAuthenticated: {isAuthenticated() ? 'true' : 'false'}</p>
          <p>isEmployer: {isEmployer() ? 'true' : 'false'}</p>
          <p>isOwner: {isOwner ? 'true' : 'false'}</p>
          <p>isActive: {isActive ? 'true' : 'false'}</p>
          <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
            <button 
              onClick={() => setShowApplicationForm(!showApplicationForm)}
              style={{background: '#0a66c2', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px'}}
            >
              Toggle Application Form
            </button>
            <button 
              onClick={() => console.log('Current job:', job)}
              style={{background: '#388e3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px'}}
            >
              Log Job Data
            </button>
          </div>
        </div>
        
        {/* Application Form Section - Always render the container */}
        <div className="application-form-section" style={{marginTop: '30px'}}>
          {showApplicationForm ? (
            <div className="application-form-container" style={{border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginTop: '20px'}}>
              <h3>Application Form</h3>
              <ApplicationForm 
                jobId={jobId} 
                onCancel={() => setShowApplicationForm(false)}
                onSubmit={handleApplicationSubmit}
              />
            </div>
          ) : (
            !isEmployer() && isActive && !hasApplied && (
              <div style={{textAlign: 'center', padding: '30px', background: '#f5f9ff', borderRadius: '8px'}}>
                <h3>Interested in this position?</h3>
                <p>Submit your application now to be considered for this role.</p>
                <button 
                  className="btn-primary" 
                  style={{padding: '12px 30px', fontSize: '16px', marginTop: '15px'}}
                  onClick={toggleApplicationForm}
                >
                  Apply Now
                </button>
              </div>
            )
          )}
        </div>
        
        {isOwner && (
          <div className="employer-actions">
            <Link to={`/jobs/${jobId}/applications`} className="btn-primary">
              View Applications ({job.applicationCount || 0})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail; 