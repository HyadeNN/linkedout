import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services';
import { APPLICATION_STATUS } from '../../models/JobModel';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import './ApplicationsList.css';

const ApplicationsList = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const { user, isEmployer } = useAuth();
  const navigate = useNavigate();

  // Load job and applications
  useEffect(() => {
    if (!isEmployer()) {
      navigate('/jobs');
      return;
    }

    const fetchJobAndApplications = async () => {
      try {
        setLoading(true);
        
        // Get job details
        const jobData = await jobService.getJob(jobId);
        
        // Redirect if job doesn't belong to the user
        if (jobData.employerId !== user.uid) {
          navigate('/jobs');
          return;
        }
        
        setJob(jobData);
        
        // Get applications
        const applicationsData = await jobService.getApplications({ jobId });
        setApplications(applicationsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching job applications:', err);
        setError('An error occurred while loading applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndApplications();
  }, [jobId, user, isEmployer, navigate]);

  // Update application status
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      // Update application status
      await jobService.updateApplicationStatus(applicationId, newStatus);
      
      // Update state
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      // Update selected application
      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('An error occurred while updating application status. Please try again later.');
    }
  };

  // Show application details
  const showApplicationDetails = (application) => {
    setSelectedApp(application);
  };

  if (loading) {
    return (
      <div className="applications-page">
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="applications-page">
        <Header />
        <div className="container">
          <div className="error-message">
            {error || 'Job not found.'}
          </div>
          <Link to="/jobs/my-jobs" className="btn-secondary">
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <Header />
      <div className="container">
        <div className="applications-header">
          <div>
            <h1>Applications</h1>
            <h2>{job.title}</h2>
            <div className="job-company-info">
              <span className="job-company">{job.company}</span>
              <span className="application-count">Total: {applications.length} applications</span>
            </div>
          </div>
          
          <div className="header-actions">
            <Link to={`/jobs/${jobId}`} className="btn-secondary">
              Back to Job
            </Link>
          </div>
        </div>
        
        {applications.length === 0 ? (
          <div className="no-applications">
            <h3>No applications yet.</h3>
            <p>Your job posting hasn't received any applications yet.</p>
          </div>
        ) : (
          <div className="applications-container">
            <div className="applications-list">
              <div className="applications-list-header">
                <h3>Candidates</h3>
                <div className="status-filter">
                  {/* Status filtering can be added here */}
                </div>
              </div>
              
              <div className="applications-items">
                {applications.map(app => (
                  <div 
                    key={app.id} 
                    className={`application-item ${selectedApp?.id === app.id ? 'selected' : ''}`}
                    onClick={() => showApplicationDetails(app)}
                  >
                    <div className="applicant-info">
                      <div className="applicant-avatar">
                        {app.user?.profile_image ? (
                          <img src={app.user.profile_image} alt={app.user?.name} />
                        ) : (
                          <div className="avatar-placeholder">{app.user?.name?.charAt(0) || '?'}</div>
                        )}
                      </div>
                      <div className="applicant-details">
                        <h4>{app.user?.name || 'Unnamed Candidate'}</h4>
                        <p>{app.user?.headline || 'No Headline'}</p>
                        <span className="application-date">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="application-status">
                      <span className={`status-badge status-${app.status}`}>
                        {APPLICATION_STATUS.find(s => s.id === app.status)?.label || app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="application-details">
              {selectedApp ? (
                <>
                  <div className="application-details-header">
                    <div className="applicant-header-info">
                      <div className="applicant-avatar large">
                        {selectedApp.user?.profile_image ? (
                          <img src={selectedApp.user.profile_image} alt={selectedApp.user?.name} />
                        ) : (
                          <div className="avatar-placeholder">{selectedApp.user?.name?.charAt(0) || '?'}</div>
                        )}
                      </div>
                      <div>
                        <h3>{selectedApp.user?.name || 'Unnamed Candidate'}</h3>
                        <p>{selectedApp.user?.headline || 'No Headline'}</p>
                      </div>
                    </div>
                    <div className="application-actions">
                      <select 
                        value={selectedApp.status}
                        onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                        className={`status-select status-${selectedApp.status}`}
                      >
                        {APPLICATION_STATUS.map(status => (
                          <option key={status.id} value={status.id}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="application-detail-section">
                    <h4>Cover Letter</h4>
                    <div className="cover-letter">
                      {selectedApp.coverLetter || <em>No cover letter</em>}
                    </div>
                  </div>
                  
                  {selectedApp.resumeUrl && (
                    <div className="application-detail-section">
                      <h4>Resume</h4>
                      <div className="resume-link">
                        <a href={selectedApp.resumeUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                          View Resume
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="application-detail-section">
                    <h4>Contact</h4>
                    <div className="contact-info">
                      {/* Link to user profile */}
                      <Link to={`/profile/${selectedApp.userId}`} className="btn-link">
                        View Profile
                      </Link>
                    </div>
                  </div>
                  
                  <div className="application-detail-section">
                    <h4>Notes</h4>
                    <textarea 
                      placeholder="Add notes about this candidate..."
                      value={selectedApp.notes || ''}
                      onChange={(e) => {
                        // Update notes
                        const notes = e.target.value;
                        
                        // Update state (full implementation would require adding a method to jobService)
                        setSelectedApp(prev => ({ ...prev, notes }));
                        
                        // API call can be made here (can be debounced with setTimeout)
                      }}
                      className="notes-textarea"
                    ></textarea>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select a candidate to view details.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsList; 