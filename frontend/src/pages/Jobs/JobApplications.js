import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import '../Applications.css';

const JobApplications = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalApplications, setTotalApplications] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: `/jobs/${jobId}/applications` } });
    }
  }, [user, navigate, jobId]);

  // Fetch job details and applications
  useEffect(() => {
    if (user && jobId) {
      fetchJobDetails();
      fetchApplications();
    }
  }, [page, user, jobId]);

  const fetchJobDetails = async () => {
    try {
      const jobData = await jobService.getJob(jobId);
      
      // Check if current user is the job poster
      if (jobData.employerId !== user.uid) {
        setError('You are not authorized to view applications for this job.');
        setLoading(false);
        return;
      }
      
      setJob(jobData);
    } catch (err) {
      console.error('Failed to fetch job details:', err);
      setError('Failed to load job details. Please try again later.');
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobService.getApplications({ 
        jobId, 
        employerId: user.uid
      });

      setApplications(response);
      setTotalApplications(response.length);
      setHasMore(false); // We're fetching all applications at once
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again later.');
      setLoading(false);
    }
  };

  // Handle view application details
  const handleViewDetails = (application) => {
    setSelectedApp(application);
    setShowDetails(true);
  };

  // Handle update application status
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      setStatusUpdating(true);
      await jobService.updateApplicationStatus(applicationId, newStatus);
      
      // Update the application in our state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus, updatedAt: new Date() } 
            : app
        )
      );
      
      // Also update selected application if it's open
      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus, updatedAt: new Date() }));
      }
      
      setStatusUpdating(false);
    } catch (err) {
      console.error('Failed to update application status:', err);
      setStatusUpdating(false);
    }
  };

  // Status badge colors
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'interviewing':
        return 'status-interviewing';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return 'status-pending';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Render loading state
  if (loading && !job) {
    return (
      <div className="applications-page">
        <div className="page-header">
          <h1>Job Applications</h1>
          <Link to="/my-jobs" className="browse-button">
            My Job Postings
          </Link>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="applications-page">
        <div className="page-header">
          <h1>Job Applications</h1>
          <Link to="/my-jobs" className="browse-button">
            My Job Postings
          </Link>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchApplications} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="page-header">
        <div className="header-title">
          <h1>Applications for Job</h1>
          {job && <h2 className="job-title">{job.title}</h2>}
        </div>
        <div className="header-actions">
          <Link to="/my-jobs" className="browse-button">
            My Job Postings
          </Link>
          <Link to={`/jobs/${jobId}`} className="view-job-button">
            View Job
          </Link>
        </div>
      </div>

      <div className="applications-content">
        {applications.length === 0 ? (
          <div className="empty-state">
            <h2>No applications yet</h2>
            <p>No one has applied to this job posting yet.</p>
            <Link to="/my-jobs" className="find-jobs-button">
              View All Job Postings
            </Link>
          </div>
        ) : (
          <>
            <div className="applications-count">
              {totalApplications > 0 && 
                `${totalApplications} application${totalApplications !== 1 ? 's' : ''}`
              }
            </div>

            <div className="applications-list">
              {applications.map(application => (
                <div key={application.id} className="application-card">
                  <div className="applicant-info">
                    <div className="applicant-avatar">
                      {application.user?.profile_image ? (
                        <img src={application.user.profile_image} alt="Applicant" />
                      ) : (
                        <div className="avatar-placeholder">
                          {application.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="applicant-details">
                      <h3>{application.user?.name || "Unknown Applicant"}</h3>
                      <p>{application.user?.headline || ""}</p>
                    </div>
                  </div>
                  
                  <div className="application-info">
                    <div className="application-details">
                      <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                        {formatStatus(application.status)}
                      </div>
                      
                      <div className="application-date">
                        Applied on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="application-actions">
                    <button 
                      className="view-details-button"
                      onClick={() => handleViewDetails(application)}
                    >
                      View Application
                    </button>
                    
                    <div className="status-dropdown">
                      <select 
                        value={application.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(application.id, e.target.value)}
                        disabled={statusUpdating}
                        className={`status-select ${getStatusBadgeClass(application.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Application Details Modal */}
      {showDetails && selectedApp && (
        <div className="application-details-overlay">
          <div className="application-details-container">
            <div className="details-header">
              <h2>Application Details</h2>
              <button className="close-details-button" onClick={() => setShowDetails(false)}>×</button>
            </div>
            
            <div className="details-content">
              <div className="applicant-profile">
                <div className="applicant-header">
                  <div className="applicant-avatar large">
                    {selectedApp.user?.profile_image ? (
                      <img src={selectedApp.user.profile_image} alt="Applicant" />
                    ) : (
                      <div className="avatar-placeholder large">
                        {selectedApp.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="applicant-info">
                    <h3>{selectedApp.user?.name || "Unknown Applicant"}</h3>
                    <p>{selectedApp.user?.headline || ""}</p>
                    {selectedApp.phone && <p className="applicant-phone">Phone: {selectedApp.phone}</p>}
                  </div>
                </div>
              </div>
              
              <div className="application-status-section">
                <h4>Application Status</h4>
                <div className="status-info">
                  <div className="status-control">
                    <div className={`status-indicator ${getStatusBadgeClass(selectedApp.status)}`}>
                      {formatStatus(selectedApp.status)}
                    </div>
                    
                    <select 
                      value={selectedApp.status || 'pending'}
                      onChange={(e) => handleUpdateStatus(selectedApp.id, e.target.value)}
                      disabled={statusUpdating}
                      className="status-select-large"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <p className="status-date">
                    Applied on: {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  {selectedApp.updatedAt && selectedApp.updatedAt !== selectedApp.createdAt && (
                    <p className="status-update">
                      Last updated: {new Date(selectedApp.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedApp.experience && (
                <div className="experience-section">
                  <h4>Experience</h4>
                  <div className="experience-content">
                    <p>{selectedApp.experience}</p>
                  </div>
                </div>
              )}
              
              {selectedApp.coverLetter && (
                <div className="cover-letter-section">
                  <h4>Cover Letter</h4>
                  <div className="cover-letter-content">
                    <p>{selectedApp.coverLetter}</p>
                  </div>
                </div>
              )}
              
              {selectedApp.resumeUrl && (
                <div className="resume-section">
                  <h4>Resume</h4>
                  <a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer" className="resume-link">
                    View Uploaded Resume
                  </a>
                </div>
              )}
              
              <div className="application-notes">
                <h4>Notes</h4>
                <textarea 
                  placeholder="Add notes about this application (only visible to you)"
                  value={selectedApp.notes || ''}
                  onChange={(e) => {
                    setSelectedApp(prev => ({...prev, notes: e.target.value}));
                  }}
                  className="notes-textarea"
                />
                <button 
                  className="save-notes-button"
                  onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.status, selectedApp.notes)}
                >
                  Save Notes
                </button>
              </div>
              
              <div className="details-actions">
                <Link to={`/profile/${selectedApp.userId}`} className="view-profile-button">
                  View Applicant Profile
                </Link>
                <button className="close-button" onClick={() => setShowDetails(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications; 