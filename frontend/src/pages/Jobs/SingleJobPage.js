import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, serverTimestamp, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import Header from '../../components/common/Header';
import { jobService } from '../../services';
import { saveJob, removeSavedJob, isJobSaved } from '../../services/savedJobs';
import './SingleJobPage.css';

const SingleJobPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const { user, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();

  // Check if current user is the owner
  const isOwner = job && user && job.employerId === user.uid;
  
  // Check if job is active
  const isActive = job && job.status === 'active';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        console.log("Fetching job with ID:", jobId);
        
        // Get job document from Firestore
        const jobDocRef = doc(db, 'jobs', jobId);
        const jobDoc = await getDoc(jobDocRef);
        
        if (!jobDoc.exists()) {
          console.log("Job not found");
          setError("Job not found.");
          setLoading(false);
          return;
        }
        
        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
          createdAt: jobDoc.data().createdAt?.toDate(),
          updatedAt: jobDoc.data().updatedAt?.toDate(),
          deadline: jobDoc.data().deadline?.toDate()
        };
        
        console.log("Job data loaded:", jobData);
        setJob(jobData);
        
        if (isAuthenticated() && user) {
          // Check if user has already applied
          if (!isEmployer()) {
            const applicationsRef = collection(db, 'applications');
            const q = query(
              applicationsRef,
              where('jobId', '==', jobId),
              where('userId', '==', user.uid)
            );
            
            const querySnapshot = await getDocs(q);
            setHasApplied(!querySnapshot.empty);
            
            // Check if job is saved
            const saved = await isJobSaved(user.uid, jobId);
            setIsSaved(saved);
            
            // Increment view count
            await updateDoc(jobDocRef, {
              viewCount: increment(1)
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Error loading job details.");
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId, user, isAuthenticated, isEmployer]);
  
  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      navigate('/auth/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    if (!applicationData.coverLetter.trim()) {
      alert("Please enter a cover letter.");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create application data
      const applicationDetails = {
        coverLetter: applicationData.coverLetter,
        resumeUrl: applicationData.resumeUrl
      };
      
      // Call the jobService applyToJob function
      await jobService.applyToJob(jobId, user.uid, applicationDetails);
      
      // Update state
      setHasApplied(true);
      setShowApplyForm(false);
      alert("Application submitted successfully!");
      
    } catch (err) {
      console.error("Error submitting application:", err);
      alert("Error submitting application. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // İş ilanını kaydetme/kaydetmeyi kaldırma işlemi
  const handleSaveToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    try {
      setSavingJob(true);
      
      if (isSaved) {
        // İşi kayıtlardan kaldır
        await removeSavedJob(user.uid, jobId);
        setIsSaved(false);
      } else {
        // İşi kaydet
        await saveJob(user.uid, jobId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling saved job:", err);
      alert(isSaved 
        ? "Error removing job from saved jobs." 
        : "Error saving job.");
    } finally {
      setSavingJob(false);
    }
  };
  
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="single-job-page">
        <Header />
        <div className="container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="single-job-page">
        <Header />
        <div className="container">
          <div className="error-message">{error || "Job details could not be loaded."}</div>
          <Link to="/jobs" className="back-link">Return to Job Listings</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="single-job-page">
      <Header />
      <div className="container">
        <div className="job-header">
          <div className="job-title-info">
            <h1>{job.title}</h1>
            <div className="company-location">
              <span className="company">{job.company}</span>
              <span className="location">📍 {job.location}</span>
            </div>
          </div>
          
          <div className="job-actions">
            {isOwner ? (
              <>
                <Link to={`/jobs/edit/${jobId}`} className="btn btn-secondary">Edit</Link>
                <button className="btn btn-danger">Delete</button>
              </>
            ) : !isEmployer() && (
              <div className="action-buttons">
                {isActive && (
                  <button 
                    className={`btn btn-primary ${hasApplied ? 'applied' : ''}`}
                    onClick={() => hasApplied ? null : setShowApplyForm(true)}
                    disabled={hasApplied || submitting}
                  >
                    {hasApplied ? 'Applied' : submitting ? 'Processing...' : 'Apply'}
                  </button>
                )}
                <button 
                  className={`btn btn-save ${isSaved ? 'saved' : ''}`}
                  onClick={handleSaveToggle}
                  disabled={savingJob}
                >
                  {isSaved ? '★ Saved' : '☆ Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="job-details">
          <div className="job-info-bar">
            <div className="info-item">
              <strong>Status:</strong> 
              <span className={`status-badge ${job.status}`}>
                {job.status === 'active' ? 'Active' : 
                 job.status === 'closed' ? 'Closed' : 
                 job.status === 'draft' ? 'Draft' : job.status}
              </span>
            </div>
            <div className="info-item">
              <strong>Type:</strong> 
              <span>
                {job.type === 'full-time' ? 'Full Time' : 
                 job.type === 'part-time' ? 'Part Time' : 
                 job.type === 'contract' ? 'Contract' : 
                 job.type === 'internship' ? 'Internship' : job.type}
              </span>
            </div>
            <div className="info-item">
              <strong>Category:</strong> 
              <span>{job.category}</span>
            </div>
            {job.deadline && (
              <div className="info-item">
                <strong>Application Deadline:</strong> 
                <span>{job.deadline.toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {/* Quick Apply Button - For Mobile */}
          {!isOwner && !isEmployer() && isActive && !hasApplied && (
            <div className="mobile-apply-btn">
              <button 
                className="btn btn-primary btn-block"
                onClick={() => setShowApplyForm(true)}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Apply Now'}
              </button>
            </div>
          )}
          
          {job.salary && job.salary.min > 0 && (
            <div className="job-section">
              <h3>Salary Range</h3>
              <p className="salary">
                {job.salary.min} - {job.salary.max} {job.salary.currency || 'USD'}
              </p>
            </div>
          )}
          
          <div className="job-section">
            <h3>Job Description</h3>
            <div className="job-description">
              {job.description.split('\n').map((paragraph, index) => (
                paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </div>
          
          {job.requirements && job.requirements.length > 0 && (
            <div className="job-section">
              <h3>Requirements</h3>
              <ul className="requirements-list">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {job.skills && job.skills.length > 0 && (
            <div className="job-section">
              <h3>Skills</h3>
              <div className="skills-container">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="job-footer">
            <div className="job-meta">
              <div className="meta-item">
                <strong>Posted Date:</strong> {job.createdAt?.toLocaleDateString() || 'N/A'}
              </div>
              <div className="meta-item">
                <strong>Views:</strong> {job.viewCount || 0}
              </div>
              <div className="meta-item">
                <strong>Applications:</strong> {job.applicationCount || 0}
              </div>
            </div>
            
            <div className="job-footer-actions">
              <Link to="/jobs" className="btn btn-secondary">
                Back to Job Listings
              </Link>
              
              {!isOwner && !isEmployer() && isActive && !hasApplied && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowApplyForm(true)}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Apply'}
                </button>
              )}
            </div>
          </div>
          
          {/* Application Form */}
          {showApplyForm && (
            <div className="application-form-overlay">
              <form onSubmit={handleApply} className="application-form">
                <div className="form-group">
                  <label htmlFor="coverLetter">Cover Letter *</label>
                  <textarea 
                    id="coverLetter"
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    required
                    disabled={submitting}
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="resumeUrl">CV URL (Optional)</label>
                  <input
                    type="url"
                    id="resumeUrl"
                    name="resumeUrl"
                    value={applicationData.resumeUrl}
                    onChange={handleInputChange}
                    placeholder="URL to your online resume"
                    disabled={submitting}
                  />
                  <small>File upload system is not active yet. You can share your CV link online.</small>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowApplyForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {hasApplied && (
            <div className="applied-message">
              <p>You have already applied for this position. Your application is under review.</p>
            </div>
          )}
          
          {isOwner && (
            <div className="employer-actions">
              <Link to={`/jobs/${jobId}/applications`} className="btn btn-primary">
                View Applications ({job.applicationCount || 0})
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleJobPage; 