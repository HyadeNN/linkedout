import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  setDoc, 
  deleteDoc,
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MdLocationOn, MdWork, MdAttachMoney, MdCalendarToday, MdPerson, MdBookmark, MdBookmarkBorder } from 'react-icons/md';
import './JobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isJobEmployer, setIsJobEmployer] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [userHasApplied, setUserHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationFormData, setApplicationFormData] = useState({
    coverLetter: '',
    phone: '',
    experience: ''
  });

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        
        // Get job document
        const jobDocRef = doc(db, 'jobs', jobId);
        const jobSnapshot = await getDoc(jobDocRef);
        
        if (!jobSnapshot.exists()) {
          setError('Job not found');
          setLoading(false);
          return;
        }
        
        const jobData = jobSnapshot.data();
        
        // Get employer details
        let employerData = null;
        if (jobData.employerId) {
          const employerDocRef = doc(db, 'users', jobData.employerId);
          const employerSnapshot = await getDoc(employerDocRef);
          
          if (employerSnapshot.exists()) {
            employerData = employerSnapshot.data();
          }
        }
        
        // Check if job is saved by current user
        let isSaved = false;
        if (user) {
          const savedJobRef = doc(db, 'users', user.uid, 'savedJobs', jobId);
          const savedJobDoc = await getDoc(savedJobRef);
          isSaved = savedJobDoc.exists();
        }
        
        // Format job data
        const formattedJob = {
          id: jobSnapshot.id,
          ...jobData,
          isSaved,
          employer: employerData ? {
            id: jobData.employerId,
            name: employerData.displayName || employerData.company_name || 'Unknown Employer',
            image: employerData.photoURL || '',
            website: employerData.website || '',
            description: employerData.description || '',
          } : null,
          createdAt: jobData.createdAt?.toDate(),
          updatedAt: jobData.updatedAt?.toDate(),
          deadline: jobData.deadline?.toDate(),
        };
        
        setJob(formattedJob);
        
        // Check if current user is the employer who posted this job
        if (user && user.uid === jobData.employerId) {
          setIsJobEmployer(true);
        }
        
        // Increment view count
        try {
          await updateDoc(jobDocRef, {
            viewCount: increment(1)
          });
        } catch (error) {
          console.error('Error incrementing view count:', error);
        }
        
        // Check if user has applied
        if (user) {
          const applicationQuery = query(
            collection(db, 'applications'),
            where('jobId', '==', jobId),
            where('userId', '==', user.uid)
          );
          
          const applicationSnapshot = await getDocs(applicationQuery);
          setUserHasApplied(!applicationSnapshot.empty);
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Check if user is employer
    const checkUserRole = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnapshot = await getDoc(userDocRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setIsEmployer(userData.role === 'employer' || userData.role === 'admin');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    
    fetchJobDetails();
    checkUserRole();
  }, [jobId, user]);

  // Handle saving/unsaving job
  const handleSaveJob = async () => {
    if (!user) {
      alert('Please log in to save jobs');
      return;
    }
    
    try {
      setSaveLoading(true);
      
      const savedJobRef = doc(db, 'users', user.uid, 'savedJobs', jobId);
      
      if (job.isSaved) {
        // Unsave job
        await deleteDoc(savedJobRef);
      } else {
        // Save job
        await setDoc(savedJobRef, {
          jobId,
          savedAt: serverTimestamp(),
          title: job.title,
          company: job.company,
          location: job.location
        });
      }
      
      // Update UI
      setJob(prevJob => ({
        ...prevJob,
        isSaved: !prevJob.isSaved
      }));
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      alert('Failed to save job. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle application form submit
  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to apply for this job');
      return;
    }
    
    try {
      setApplicationSubmitting(true);
      
      // Validate form data
      if (!applicationFormData.coverLetter.trim()) {
        alert('Please provide a cover letter');
        setApplicationSubmitting(false);
        return;
      }
      
      // Create application data without resume
      const applicationData = {
        jobId,
        userId: user.uid,
        employerId: job.employerId,
        coverLetter: applicationFormData.coverLetter,
        phone: applicationFormData.phone || '',
        experience: applicationFormData.experience || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        jobTitle: job.title,
        companyName: job.company,
        userName: user.displayName || '',
        userEmail: user.email || '',
        userPhotoURL: user.photoURL || '',
        // Additional fields to ensure they're defined
        applicationDate: new Date().toISOString(),
        viewed: false
      };
      
      console.log('Submitting application with data:', applicationData);
      
      // Create application document
      const applicationsCollection = collection(db, 'applications');
      const applicationRef = await addDoc(applicationsCollection, applicationData);
      console.log('Application submitted with ID:', applicationRef.id);
      
      // Increment application count
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        applicationCount: increment(1)
      });
      console.log('Job application count incremented');
      
      // Show success message and reset form
      setApplicationSuccess(true);
      setUserHasApplied(true);
      setShowApplicationForm(false);
      setApplicationFormData({
        coverLetter: '',
        phone: '',
        experience: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again. Error: ' + error.message);
    } finally {
      setApplicationSubmitting(false);
    }
  };

  // Handle input change in application form
  const handleApplicationInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Fetch applications for employer
  const fetchApplications = async () => {
    if (!isJobEmployer) return;
    
    try {
      setApplicationsLoading(true);
      
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId)
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      if (applicationsSnapshot.empty) {
        console.log('No applications found for this job');
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }
      
      console.log(`Found ${applicationsSnapshot.docs.length} applications`);
      
      const applicationsData = await Promise.all(
        applicationsSnapshot.docs.map(async (docSnapshot) => {
          const applicationData = docSnapshot.data();
          
          // Get applicant details
          let applicantData = null;
          if (applicationData.userId) {
            const applicantDocRef = doc(db, 'users', applicationData.userId);
            const applicantSnapshot = await getDoc(applicantDocRef);
            
            if (applicantSnapshot.exists()) {
              applicantData = applicantSnapshot.data();
            }
          }
          
          return {
            id: docSnapshot.id,
            ...applicationData,
            applicant: applicantData ? {
              id: applicationData.userId,
              name: applicantData.displayName || applicationData.userName || 'Unknown Applicant',
              headline: applicantData.headline || '',
              photoURL: applicantData.photoURL || applicationData.userPhotoURL || '',
            } : null,
            createdAt: applicationData.createdAt?.toDate() || new Date(),
            updatedAt: applicationData.updatedAt?.toDate() || new Date(),
          };
        })
      );
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to load applications. Error: ' + error.message);
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Update application status
  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus, updatedAt: new Date() }
            : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <div className="loading-indicator">Loading job details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-page">
        <div className="error-message">{error}</div>
        <Link to="/jobs">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-header">
        <div className="job-detail-title-section">
          <h1 className="job-detail-title">{job.title}</h1>
          <p className="job-detail-company">{job.company}</p>
          <p className="job-detail-location">
            <MdLocationOn />
            {job.location} {job.isRemote && '(Remote)'}
          </p>
          
          <div className="job-detail-meta">
            {job.jobType && (
              <span className="job-detail-meta-item">
                <MdWork /> {job.jobType}
              </span>
            )}
            
            {job.salary && (
              <span className="job-detail-meta-item">
                <MdAttachMoney />
                {job.salary.min && job.salary.max
                  ? `${job.salary.min} - ${job.salary.max} ${job.salary.currency || 'USD'}`
                  : job.salary.min
                  ? `From ${job.salary.min} ${job.salary.currency || 'USD'}`
                  : job.salary.max
                  ? `Up to ${job.salary.max} ${job.salary.currency || 'USD'}`
                  : ''}
              </span>
            )}
            
            {job.applicationCount !== undefined && (
              <span className="job-detail-meta-item">
                <MdPerson /> {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
              </span>
            )}
            
            {job.createdAt && (
              <span className="job-detail-meta-item">
                <MdCalendarToday /> Posted on {job.createdAt.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="job-detail-actions">
          {!isJobEmployer ? (
            <>
              {userHasApplied ? (
                <button className="apply-btn" disabled>
                  Applied
                </button>
              ) : (
                <button
                  className="apply-btn"
                  onClick={() => setShowApplicationForm(true)}
                >
                  Apply Now
                </button>
              )}
              
              <button
                className={`save-btn ${job.isSaved ? 'saved' : ''}`}
                onClick={handleSaveJob}
                disabled={saveLoading}
              >
                {job.isSaved ? (
                  <>
                    <MdBookmark /> Saved
                  </>
                ) : (
                  <>
                    <MdBookmarkBorder /> Save
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <Link to={`/jobs/${jobId}/edit`} className="apply-btn">
                Edit Job
              </Link>
              <button
                className="save-btn"
                onClick={fetchApplications}
              >
                View Applications ({job.applicationCount || 0})
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="job-detail-container">
        <div className="job-detail-content">
          <div className="job-detail-section">
            <h2 className="section-title">Job Description</h2>
            <div className="job-description">{job.description}</div>
          </div>
          
          {job.requirements && (
            <div className="job-detail-section">
              <h2 className="section-title">Requirements</h2>
              <div className="job-requirements">{job.requirements}</div>
            </div>
          )}
          
          {showApplicationForm && (
            <div className="application-form-container">
              <h2 className="form-title">Apply for this position</h2>
              
              <form className="application-form" onSubmit={handleApplicationSubmit}>
                <div className="form-group">
                  <label htmlFor="coverLetter">Cover Letter / Introduction <span className="required">*</span></label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    className="form-control"
                    value={applicationFormData.coverLetter}
                    onChange={handleApplicationInputChange}
                    rows={6}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="experience">Relevant Experience</label>
                  <textarea
                    id="experience"
                    name="experience"
                    className="form-control"
                    value={applicationFormData.experience}
                    onChange={handleApplicationInputChange}
                    rows={4}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-control"
                    value={applicationFormData.phone}
                    onChange={handleApplicationInputChange}
                  />
                </div>
                
                <div className="submit-group">
                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => setShowApplicationForm(false)}
                    disabled={applicationSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="apply-btn"
                    disabled={applicationSubmitting}
                  >
                    {applicationSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {applicationSuccess && (
            <div className="success-message">
              Your application has been submitted successfully!
            </div>
          )}
          
          {isJobEmployer && applications.length > 0 && (
            <div className="applications-section">
              <div className="applications-title">
                Applications
                <span className="applications-count">{applications.length}</span>
              </div>
              
              <div className="applications-list">
                {applications.map(application => (
                  <div key={application.id} className="application-card">
                    <img
                      src={application.applicant?.photoURL || '/default-avatar.png'}
                      alt={application.applicant?.name}
                      className="applicant-photo"
                    />
                    
                    <div className="application-info">
                      <h3 className="applicant-name">{application.applicant?.name}</h3>
                      <p className="applicant-headline">{application.applicant?.headline || application.userEmail}</p>
                      <p className="application-date">
                        Applied on {application.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="application-actions">
                      <Link
                        to={`/jobs/applications/${application.id}`}
                        className="view-application-btn"
                      >
                        View
                      </Link>
                      
                      <select
                        className="status-select"
                        value={application.status}
                        onChange={(e) => handleUpdateApplicationStatus(application.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isJobEmployer && applications.length === 0 && applicationsLoading === false && (
            <div className="applications-section">
              <div className="applications-title">
                Applications
              </div>
              <div className="no-applications-message">
                No applications found for this job posting yet.
              </div>
            </div>
          )}
        </div>
        
        <div className="job-detail-sidebar">
          <div className="company-card">
            <h2 className="company-title">About the Company</h2>
            
            <div className="company-info">
              <img
                src={job.employer?.image || '/company-placeholder.png'}
                alt={job.company}
                className="company-logo"
              />
              
              <div className="company-details">
                <h3 className="company-name">{job.company}</h3>
                
                {job.employer?.website && (
                  <a
                    href={job.employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-website"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
            
            {job.employer?.description && (
              <p className="company-description">{job.employer.description}</p>
            )}
            
            <Link to={`/company/${job.employerId}`} className="view-company-btn">
              View company profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;