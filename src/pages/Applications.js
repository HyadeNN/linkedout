import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Applications.css';

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalApplications, setTotalApplications] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { state: { from: '/jobs/applications' } });
      return;
    }
    
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log("Fetching applications for user:", user.uid);
      
      // Create a reference to the applications collection
      const applicationsRef = collection(db, 'applications');
      
      // Create a query against the collection
      const q = query(
        applicationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} applications`);
      
      if (querySnapshot.empty) {
        console.log("No applications found for user");
        setApplications([]);
        setTotalApplications(0);
        setLoading(false);
        return;
      }
      
      // Process application data with job details
      const applicationData = await Promise.all(
        querySnapshot.docs.map(async (applicationDoc) => {
          const application = {
            id: applicationDoc.id,
            ...applicationDoc.data(),
            createdAt: applicationDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: applicationDoc.data().updatedAt?.toDate() || new Date()
          };
          
          // Get job details for this application
          if (application.jobId) {
            try {
              const jobRef = doc(db, 'jobs', application.jobId);
              const jobDoc = await getDoc(jobRef);
              
              if (jobDoc.exists()) {
                application.job = {
                  id: jobDoc.id,
                  title: jobDoc.data().title || 'Unknown Job',
                  company: jobDoc.data().company || 'Unknown Company',
                  location: jobDoc.data().location || '',
                  isRemote: jobDoc.data().isRemote || false
                };
              } else {
                console.log(`Job ${application.jobId} not found`);
                application.job = {
                  title: application.jobTitle || 'Job Removed',
                  company: application.companyName || 'Company'
                };
              }
            } catch (jobError) {
              console.error(`Error fetching job ${application.jobId}:`, jobError);
              application.job = {
                title: application.jobTitle || 'Job Information Unavailable',
                company: application.companyName || 'Company'
              };
            }
          }
          
          return application;
        })
      );
      
      setApplications(applicationData);
      setTotalApplications(applicationData.length);
      setHasMore(false); // No pagination in this implementation
      
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load your applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Status badge colors
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'reviewing':
        return 'status-reviewing';
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

  // Format status text and add descriptions
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };
  
  // Get status description for users
  const getStatusDescription = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Your application is waiting to be reviewed by the employer.';
      case 'reviewing':
        return 'The employer is currently reviewing your application.';
      case 'interviewing':
        return 'Congratulations! The employer wants to move forward with an interview.';
      case 'accepted':
        return 'Congratulations! Your application has been accepted.';
      case 'rejected':
        return 'Unfortunately, the employer has decided not to move forward with your application.';
      default:
        return 'Your application has been submitted.';
    }
  };

  // Render loading state
  if (loading && applications.length === 0) {
    return (
      <div className="applications-page">
        <div className="page-header">
          <h1>My Applications</h1>
          <Link to="/jobs" className="browse-button">
            Find Jobs
          </Link>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="applications-page">
        <div className="page-header">
          <h1>My Applications</h1>
          <Link to="/jobs" className="browse-button">
            Find Jobs
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
        <h1>My Applications</h1>
        <div className="header-actions">
          <Link to="/jobs" className="browse-button">
            Find Jobs
          </Link>
          <Link to="/jobs/saved" className="saved-jobs-button">
            Saved Jobs
          </Link>
        </div>
      </div>

      <div className="applications-content">
        {applications.length === 0 ? (
          <div className="empty-state">
            <h2>No applications yet</h2>
            <p>You haven't applied to any jobs yet. Start applying to track your application status.</p>
            <Link to="/jobs" className="find-jobs-button">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <>
            <div className="applications-count">
              {totalApplications > 0 && 
                `Showing ${applications.length} of ${totalApplications} application${totalApplications !== 1 ? 's' : ''}`
              }
            </div>

            <div className="applications-list">
              {applications.map(application => (
                <div key={application.id} className="application-card">
                  <div className="application-info">
                    <h2 className="job-title">
                      <Link to={`/jobs/${application.jobId}`}>{application.job?.title || application.jobTitle || 'Job Title'}</Link>
                    </h2>
                    <p className="job-company">{application.job?.company || application.companyName || 'Company'}</p>
                    <p className="job-location">
                      {application.job?.location || ''}
                      {application.job?.isRemote && <span className="remote-badge">Remote</span>}
                    </p>
                    
                    <div className="application-details">
                      <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                        {formatStatus(application.status)}
                      </div>
                      
                      <div className="application-date">
                        Applied on {application.createdAt ? application.createdAt.toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="status-description">
                      {getStatusDescription(application.status)}
                    </div>
                    
                    {application.notes && (
                      <div className="employer-notes">
                        <h3>Employer Notes</h3>
                        <p>{application.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="application-actions">
                    <Link to={`/jobs/${application.jobId}`} className="view-job-button">
                      View Job
                    </Link>
                    <Link 
                      to={`/jobs/applications/${application.id}`} 
                      className="view-details-button"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Applications; 