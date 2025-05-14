import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  doc, 
  getDoc, 
  serverTimestamp, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MdLocationOn, MdWork, MdBookmark, MdBookmarkBorder } from 'react-icons/md';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    jobType: '',
    isRemote: false,
    minSalary: '',
    maxSalary: ''
  });
  const [isEmployer, setIsEmployer] = useState(false);

  // Check if user is employer
  useEffect(() => {
    if (user) {
      // Get user's role from Firestore
      const fetchUserRole = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsEmployer(userData.role === 'employer' || userData.role === 'admin');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      };
      
      fetchUserRole();
    }
  }, [user]);

  // Fetch jobs when component mounts or filters change
  useEffect(() => {
    fetchJobs(true);
  }, [filters]);

  // Fetch jobs from Firestore
  const fetchJobs = async (resetPagination = false) => {
    try {
      setLoading(true);
      
      // Start with base query
      let jobsRef = collection(db, 'jobs');
      let queryConstraints = [
        orderBy('createdAt', 'desc'),
      ];
      
      // Add filters
      if (filters.jobType) {
        queryConstraints.push(where('jobType', '==', filters.jobType));
      }
      
      if (filters.isRemote) {
        queryConstraints.push(where('isRemote', '==', true));
      }
      
      // Apply pagination
      if (lastVisible && !resetPagination) {
        queryConstraints.push(startAfter(lastVisible));
      }
      
      queryConstraints.push(limit(10));
      
      // Execute query
      const jobsQuery = query(jobsRef, ...queryConstraints);
      const snapshot = await getDocs(jobsQuery);
      
      // Update last visible for pagination
      if (!snapshot.empty) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
      
      // Map documents to job objects
      let fetchedJobs = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const jobData = docSnapshot.data();
          
          // Check if job is saved by current user
          let isSaved = false;
          if (user) {
            const savedJobRef = doc(db, 'users', user.uid, 'savedJobs', docSnapshot.id);
            const savedJobDoc = await getDoc(savedJobRef);
            isSaved = savedJobDoc.exists();
          }
          
          // Get employer name and profile image
          let employerName = '';
          let employerImage = '';
          if (jobData.employerId) {
            const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
            if (employerDoc.exists()) {
              const employerData = employerDoc.data();
              employerName = employerData.displayName || '';
              employerImage = employerData.photoURL || '';
            }
          }
          
          return {
            id: docSnapshot.id,
            ...jobData,
            isSaved,
            employer: {
              id: jobData.employerId,
              name: jobData.companyName || employerName,
              image: employerImage
            },
            createdAt: jobData.createdAt?.toDate(),
          };
        })
      );
      
      // Apply client-side filtering
      if (filters.query) {
        const query = filters.query.toLowerCase();
        fetchedJobs = fetchedJobs.filter(job => 
          job.title?.toLowerCase().includes(query) || 
          job.company?.toLowerCase().includes(query) || 
          job.description?.toLowerCase().includes(query)
        );
      }
      
      if (filters.location) {
        const location = filters.location.toLowerCase();
        fetchedJobs = fetchedJobs.filter(job => 
          job.location?.toLowerCase().includes(location)
        );
      }
      
      if (filters.minSalary) {
        fetchedJobs = fetchedJobs.filter(job => 
          job.salary?.min >= parseFloat(filters.minSalary)
        );
      }
      
      if (filters.maxSalary) {
        fetchedJobs = fetchedJobs.filter(job => 
          job.salary?.max <= parseFloat(filters.maxSalary)
        );
      }
      
      setJobs(prevJobs => resetPagination ? fetchedJobs : [...prevJobs, ...fetchedJobs]);
      setTotalJobs(prevTotal => resetPagination ? fetchedJobs.length : prevTotal + fetchedJobs.length);
      
      if (fetchedJobs.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle loading more jobs
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchJobs(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(true);
  };

  // Handle saving/unsaving a job
  const handleSaveJob = async (jobId) => {
    if (!user) {
      alert('Please log in to save jobs');
      return;
    }
    
    try {
      setSaveLoading(true);
      
      const job = jobs.find(job => job.id === jobId);
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
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
        )
      );
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1 className="page-title">Find Jobs</h1>
        
        <div className="jobs-actions">
          {isEmployer && (
            <Link to="/jobs/create" className="post-job-btn">
              Post a Job
            </Link>
          )}
          
          <Link to="/jobs/my-jobs" className="my-jobs-btn">
            {isEmployer ? 'My Job Postings' : 'My Applications'}
          </Link>
          
          <Link to="/jobs/saved" className="saved-jobs-btn">
            Saved Jobs
          </Link>
        </div>
      </div>
      
      <div className="jobs-container">
        <div className="jobs-filters">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-fields">
              <div className="form-group">
                <input
                  type="text"
                  name="query"
                  value={filters.query}
                  onChange={handleFilterChange}
                  placeholder="Search job titles, companies, or keywords"
                  className="search-input"
                />
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Location"
                  className="location-input"
                />
              </div>
              
              <button type="submit" className="search-btn">
                Search
              </button>
            </div>
            
            <div className="advanced-filters">
              <h3 className="filter-title">Filters</h3>
              
              <div className="filter-group">
                <label htmlFor="jobType">Job Type</label>
                <select
                  id="jobType"
                  name="jobType"
                  value={filters.jobType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div className="filter-group checkbox-group">
                <input
                  type="checkbox"
                  id="isRemote"
                  name="isRemote"
                  checked={filters.isRemote}
                  onChange={handleFilterChange}
                />
                <label htmlFor="isRemote">Remote Jobs Only</label>
              </div>
              
              <div className="filter-group">
                <label htmlFor="minSalary">Minimum Salary</label>
                <input
                  type="number"
                  id="minSalary"
                  name="minSalary"
                  value={filters.minSalary}
                  onChange={handleFilterChange}
                  placeholder="Min"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="maxSalary">Maximum Salary</label>
                <input
                  type="number"
                  id="maxSalary"
                  name="maxSalary"
                  value={filters.maxSalary}
                  onChange={handleFilterChange}
                  placeholder="Max"
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="jobs-content">
          {loading && jobs.length === 0 ? (
            <div className="loading-indicator">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <h3>No jobs found</h3>
              <p>Try adjusting your search filters or check back later for new opportunities.</p>
            </div>
          ) : (
            <>
              <div className="jobs-count">
                Showing {jobs.length} jobs
              </div>
              
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
                        {job.location}
                        {job.isRemote && ' (Remote)'}
                      </p>
                      
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
                      
                      <p className="job-date">
                        Posted: {job.createdAt ? job.createdAt.toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="job-actions">
                      <Link to={`/jobs/${job.id}`} className="view-job-btn">
                        View Job
                      </Link>
                      
                      <button
                        className={`save-job-btn ${job.isSaved ? 'saved' : ''}`}
                        onClick={() => handleSaveJob(job.id)}
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
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Jobs'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs; 