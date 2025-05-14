import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MdLocationOn, MdWork, MdDelete, MdEdit, MdVisibility, MdPerson } from 'react-icons/md';
import './Jobs.css';

const MyJobs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEmployer, setIsEmployer] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('posted');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user is employer
      const checkUserRole = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isEmployerUser = userData.role === 'employer' || userData.role === 'admin';
            setIsEmployer(isEmployerUser);
            
            // Set default active tab based on role
            setActiveTab(isEmployerUser ? 'posted' : 'applications');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      };
      
      checkUserRole();
      
      // Fetch data based on role
      if (isEmployer) {
        fetchPostedJobs();
      } else {
        fetchApplications();
      }
    }
  }, [user, isEmployer]);

  // Fetch jobs posted by the employer
  const fetchPostedJobs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('employerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(jobsQuery);
      
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        deadline: doc.data().deadline?.toDate()
      }));
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications by the user
  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(applicationsQuery);
      
      const applicationsData = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const applicationData = appDoc.data();
          
          // Get job details
          let jobData = null;
          if (applicationData.jobId) {
            const jobDoc = await getDoc(doc(db, 'jobs', applicationData.jobId));
            if (jobDoc.exists()) {
              jobData = jobDoc.data();
            }
          }
          
          return {
            id: appDoc.id,
            ...applicationData,
            job: jobData ? {
              id: applicationData.jobId,
              title: jobData.title || applicationData.jobTitle || 'Unknown Job',
              company: jobData.company || applicationData.companyName || '',
              location: jobData.location || '',
            } : null,
            createdAt: applicationData.createdAt?.toDate(),
            updatedAt: applicationData.updatedAt?.toDate()
          };
        })
      );
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'posted') {
      fetchPostedJobs();
    } else if (tab === 'applications') {
      fetchApplications();
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      // Delete job document
      await deleteDoc(doc(db, 'jobs', jobId));
      
      // Update UI
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      
      alert('Job posting deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'reviewing': return 'status-reviewing';
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1 className="page-title">
          {isEmployer ? 'Manage Your Jobs' : 'Your Job Applications'}
        </h1>
        
        <div className="jobs-actions">
          {isEmployer && (
            <Link to="/jobs/create" className="post-job-btn">
              Post a New Job
            </Link>
          )}
          
          <Link to="/jobs" className="my-jobs-btn">
            Browse All Jobs
          </Link>
        </div>
      </div>
      
      {isEmployer && (
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'posted' ? 'active' : ''}`}
            onClick={() => handleTabChange('posted')}
          >
            Your Job Postings
          </button>
          <button
            className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => handleTabChange('applications')}
          >
            Your Applications
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="loading-indicator">Loading...</div>
      ) : activeTab === 'posted' ? (
        <div className="jobs-content">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <h3>No job postings found</h3>
              <p>You haven't posted any jobs yet. Click "Post a New Job" to get started.</p>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-info">
                    <h2 className="job-title">
                      <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                    </h2>
                    
                    <p className="job-company">{job.company}</p>
                    
                    <p className="job-location">
                      <MdLocationOn />
                      {job.location} {job.isRemote && '(Remote)'}
                    </p>
                    
                    <div className="job-details">
                      <span className="job-type">
                        <MdWork /> {job.jobType}
                      </span>
                      
                      <span className="job-applications">
                        <MdPerson /> {job.applicationCount || 0} application(s)
                      </span>
                      
                      <span className="job-views">
                        <MdVisibility /> {job.viewCount || 0} view(s)
                      </span>
                    </div>
                    
                    <p className="job-date">
                      Posted: {formatDate(job.createdAt)}
                      {job.deadline && ` · Deadline: ${formatDate(job.deadline)}`}
                    </p>
                  </div>
                  
                  <div className="job-actions">
                    <Link to={`/jobs/${job.id}`} className="view-job-btn">
                      View
                    </Link>
                    
                    <Link to={`/jobs/${job.id}/edit`} className="edit-job-btn">
                      <MdEdit /> Edit
                    </Link>
                    
                    <button
                      className="delete-job-btn"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deleteLoading}
                    >
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="jobs-content">
          {applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications found</h3>
              <p>You haven't applied to any jobs yet. Browse available jobs to apply.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map(application => (
                <div key={application.id} className="job-card">
                  <div className="job-info">
                    <h2 className="job-title">
                      {application.job ? (
                        <Link to={`/jobs/${application.jobId}`}>{application.job.title}</Link>
                      ) : (
                        application.jobTitle || 'Unknown Position'
                      )}
                    </h2>
                    
                    <p className="job-company">
                      {application.job?.company || application.companyName || 'Unknown Company'}
                    </p>
                    
                    {application.job?.location && (
                      <p className="job-location">
                        <MdLocationOn />
                        {application.job.location}
                      </p>
                    )}
                    
                    <div className="job-details">
                      <span className={`application-status ${getStatusBadgeClass(application.status)}`}>
                        Status: {application.status || 'pending'}
                      </span>
                    </div>
                    
                    <p className="job-date">
                      Applied: {formatDate(application.createdAt)}
                      {application.updatedAt && application.updatedAt > application.createdAt && 
                        ` · Updated: ${formatDate(application.updatedAt)}`}
                    </p>
                  </div>
                  
                  <div className="job-actions">
                    <Link to={`/jobs/${application.jobId}`} className="view-job-btn">
                      View Job
                    </Link>
                    
                    <Link to={`/jobs/applications/${application.id}`} className="view-application-btn">
                      View Application
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyJobs;