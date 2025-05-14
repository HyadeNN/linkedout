import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MdArrowBack, MdCheck, MdClose, MdAccessTime } from 'react-icons/md';
import '../Applications.css';
import './ApplicationDetail.css';

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!user) {
        navigate('/auth/login');
        return;
      }

      try {
        setLoading(true);
        
        // Get application details
        const applicationRef = doc(db, 'applications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);
        
        if (!applicationSnapshot.exists()) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        
        const applicationData = applicationSnapshot.data();
        console.log('Fetched application:', applicationData);
        
        // Check if user is authorized to view this application
        if (applicationData.userId !== user.uid && applicationData.employerId !== user.uid) {
          setError('You are not authorized to view this application');
          setLoading(false);
          return;
        }
        
        // Set isEmployer flag
        setIsEmployer(applicationData.employerId === user.uid);
        
        // Set initial status and notes
        setNewStatus(applicationData.status || 'pending');
        setNotes(applicationData.notes || '');
        
        // Format application data
        const formattedApplication = {
          id: applicationSnapshot.id,
          ...applicationData,
          createdAt: applicationData.createdAt?.toDate() || new Date(),
          updatedAt: applicationData.updatedAt?.toDate() || new Date(),
        };
        
        setApplication(formattedApplication);
        
        // Get job details
        if (applicationData.jobId) {
          const jobRef = doc(db, 'jobs', applicationData.jobId);
          const jobSnapshot = await getDoc(jobRef);
          
          if (jobSnapshot.exists()) {
            const jobData = jobSnapshot.data();
            setJob({
              id: jobSnapshot.id,
              ...jobData,
              createdAt: jobData.createdAt?.toDate(),
              deadline: jobData.deadline?.toDate(),
            });
          }
        }
        
        // Get applicant details
        if (applicationData.userId) {
          const applicantRef = doc(db, 'users', applicationData.userId);
          const applicantSnapshot = await getDoc(applicantRef);
          
          if (applicantSnapshot.exists()) {
            const applicantData = applicantSnapshot.data();
            setApplicant({
              id: applicantSnapshot.id,
              ...applicantData,
              name: applicantData.displayName || applicationData.userName || 'Unknown Applicant',
              photoURL: applicantData.profile?.profile_image || 
                      applicantData.photoURL || 
                      applicationData.userPhotoURL || 
                      '/default-avatar.png',
            });
          } else {
            setApplicant({
              id: applicationData.userId,
              name: applicationData.userName || 'Unknown Applicant',
              email: applicationData.userEmail || '',
              photoURL: applicationData.userPhotoURL || '/default-avatar.png',
            });
          }
        }
        
        // Mark as viewed if employer is viewing
        if (applicationData.employerId === user.uid && !applicationData.viewed) {
          await updateDoc(applicationRef, {
            viewed: true,
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error fetching application details:', error);
        setError('Failed to load application details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicationDetails();
  }, [applicationId, user, navigate]);
  
  // Update application status
  const handleUpdateStatus = async () => {
    if (!isEmployer) return;
    
    try {
      setIsUpdating(true);
      
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        notes: notes,
        updatedAt: serverTimestamp()
      });
      
      // Update local application object
      setApplication(prev => ({
        ...prev,
        status: newStatus,
        notes: notes,
        updatedAt: new Date()
      }));
      
      alert('Application status updated successfully');
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'reviewing':
        return 'status-reviewing';
      case 'interviewing':
        return 'status-interviewing';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };
  
  // Format status text
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="application-detail-page">
        <div className="loading-indicator">Loading application details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-detail-page">
        <div className="error-message">{error}</div>
        <Link to="/jobs/applications" className="back-button">
          <MdArrowBack /> Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="application-detail-page">
      <div className="application-detail-header">
        <Link to={isEmployer ? `/jobs/${application.jobId}` : "/jobs/applications"} className="back-button">
          <MdArrowBack /> {isEmployer ? 'Back to Job' : 'Back to My Applications'}
        </Link>
        
        <h1 className="page-title">Application Details</h1>
      </div>
      
      <div className="detail-content">
        <div className="detail-main">
          <div className="job-summary card">
            <h2 className="card-title">Job Summary</h2>
            <div className="job-info">
              <h3 className="job-title">{job?.title || application.jobTitle}</h3>
              <p className="company-name">{job?.company || application.companyName}</p>
              {job?.location && <p className="job-location">{job.location}</p>}
              
              <div className="job-meta">
                {job?.jobType && <span className="job-type">{job.jobType}</span>}
                {job?.isRemote && <span className="remote-tag">Remote</span>}
              </div>
              
              <Link to={`/jobs/${application.jobId}`} className="view-job-button">
                View Job Posting
              </Link>
            </div>
          </div>
          
          <div className="application-status card">
            <h2 className="card-title">Application Status</h2>
            <div className="status-info">
              <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                {formatStatus(application.status)}
              </div>
              
              <div className="status-dates">
                <p className="date-item">
                  <span className="date-label">Applied on:</span> 
                  {application.createdAt.toLocaleDateString()}
                </p>
                
                {application.updatedAt && application.updatedAt !== application.createdAt && (
                  <p className="date-item">
                    <span className="date-label">Last updated:</span> 
                    {application.updatedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="application-content card">
            <h2 className="card-title">Application Content</h2>
            
            {application.coverLetter && (
              <div className="content-section">
                <h3 className="section-title">Cover Letter</h3>
                <div className="cover-letter-content">
                  <p>{application.coverLetter}</p>
                </div>
              </div>
            )}
            
            {application.experience && (
              <div className="content-section">
                <h3 className="section-title">Relevant Experience</h3>
                <div className="experience-content">
                  <p>{application.experience}</p>
                </div>
              </div>
            )}
            
            {application.phone && (
              <div className="content-section">
                <h3 className="section-title">Contact Phone</h3>
                <p className="phone-number">{application.phone}</p>
              </div>
            )}
          </div>
          
          {isEmployer && (
            <div className="employer-actions card">
              <h2 className="card-title">Update Application Status</h2>
              
              <div className="status-update-form">
                <div className="form-group">
                  <label htmlFor="status-select">Status</label>
                  <select 
                    id="status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes-input">Notes to Applicant</label>
                  <textarea
                    id="notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for the applicant (optional)"
                    rows={4}
                    className="notes-input"
                  ></textarea>
                </div>
                
                <button 
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                  className="update-status-button"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="detail-sidebar">
          <div className="applicant-info card">
            <h2 className="card-title">Applicant</h2>
            <div className="applicant-profile">
              <div className="applicant-photo-container">
                <img 
                  src={applicant?.photoURL || '/default-avatar.png'} 
                  alt={applicant?.name}
                  className="applicant-photo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              
              <div className="applicant-details">
                <h3 className="applicant-name">{applicant?.name}</h3>
                {applicant?.email && <p className="applicant-email">{applicant.email}</p>}
                {applicant?.headline && <p className="applicant-headline">{applicant.headline}</p>}
                
                {isEmployer && applicant?.id && (
                  <Link to={`/users/${applicant.id}`} className="view-profile-button">
                    View Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {application.notes && (
            <div className="employer-notes card">
              <h2 className="card-title">Employer Notes</h2>
              <div className="notes-content">
                <p>{application.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail; 