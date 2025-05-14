import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MdLocationOn, MdWork, MdBookmarkRemove } from 'react-icons/md';
import './Jobs.css';

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchSavedJobs();
  }, [user, navigate]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      
      // Query saved jobs subcollection for the user
      const savedJobsRef = collection(db, 'users', user.uid, 'savedJobs');
      const savedJobsQuery = query(savedJobsRef, orderBy('savedAt', 'desc'));
      const savedJobsSnapshot = await getDocs(savedJobsQuery);
      
      // Fetch full job details for each saved job
      const savedJobsWithDetails = await Promise.all(
        savedJobsSnapshot.docs.map(async (savedJobDoc) => {
          const savedJobData = savedJobDoc.data();
          
          // Get the full job details
          let jobData = null;
          if (savedJobData.jobId) {
            const jobDoc = await getDoc(doc(db, 'jobs', savedJobData.jobId));
            if (jobDoc.exists()) {
              jobData = jobDoc.data();
              
              // Get employer details
              let employerData = null;
              if (jobData.employerId) {
                const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
                if (employerDoc.exists()) {
                  employerData = employerDoc.data();
                }
              }
              
              return {
                id: savedJobData.jobId,
                savedAt: savedJobData.savedAt?.toDate(),
                ...jobData,
                employer: employerData ? {
                  id: jobData.employerId,
                  name: employerData.displayName || employerData.name || '',
                  photoURL: employerData.photoURL || ''
                } : null,
                createdAt: jobData.createdAt?.toDate(),
                updatedAt: jobData.updatedAt?.toDate(),
                deadline: jobData.deadline?.toDate(),
                isSaved: true
              };
            }
          }
          
          // If job doesn't exist anymore, return basic saved data
          return {
            id: savedJobData.jobId,
            savedAt: savedJobData.savedAt?.toDate(),
            title: savedJobData.title || 'Unknown Job',
            company: savedJobData.company || 'Unknown Company',
            location: savedJobData.location || '',
            isSaved: true,
            isDeleted: true
          };
        })
      );
      
      setSavedJobs(savedJobsWithDetails.filter(job => job !== null));
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (jobId) => {
    try {
      setRemoveLoading(true);
      
      // Delete saved job reference
      await deleteDoc(doc(db, 'users', user.uid, 'savedJobs', jobId));
      
      // Update UI
      setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error removing saved job:', error);
      alert('Failed to remove job from saved list. Please try again.');
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1 className="page-title">Saved Jobs</h1>
        
        <div className="jobs-actions">
          <Link to="/jobs" className="my-jobs-btn">
            Browse Jobs
          </Link>
          
          <Link to="/jobs/my-jobs" className="my-jobs-btn">
            My Applications
          </Link>
        </div>
      </div>
      
      <div className="jobs-content">
        {loading ? (
          <div className="loading-indicator">Loading saved jobs...</div>
        ) : savedJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No saved jobs</h3>
            <p>You haven't saved any jobs yet. Browse jobs and save the ones you're interested in.</p>
            <Link to="/jobs" className="search-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="jobs-list">
            {savedJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-info">
                  <h2 className="job-title">
                    {job.isDeleted ? (
                      <span>{job.title} (No longer available)</span>
                    ) : (
                      <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                    )}
                  </h2>
                  
                  <p className="job-company">{job.company}</p>
                  
                  <p className="job-location">
                    <MdLocationOn />
                    {job.location} {job.isRemote && '(Remote)'}
                  </p>
                  
                  {!job.isDeleted && (
                    <div className="job-details">
                      {job.jobType && (
                        <span className="job-type">
                          <MdWork /> {job.jobType}
                        </span>
                      )}
                      
                      {job.salary && (
                        <span className="job-salary">
                          {job.salary.min && job.salary.max
                            ? `${job.salary.min} - ${job.salary.max} ${job.salary.currency || 'USD'}`
                            : job.salary.min
                            ? `From ${job.salary.min} ${job.salary.currency || 'USD'}`
                            : job.salary.max
                            ? `Up to ${job.salary.max} ${job.salary.currency || 'USD'}`
                            : ''}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="job-date">
                    Saved on: {job.savedAt ? job.savedAt.toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div className="job-actions">
                  {!job.isDeleted && (
                    <Link to={`/jobs/${job.id}`} className="view-job-btn">
                      View Job
                    </Link>
                  )}
                  
                  <button
                    className="delete-job-btn"
                    onClick={() => handleRemoveSavedJob(job.id)}
                    disabled={removeLoading}
                  >
                    <MdBookmarkRemove /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;