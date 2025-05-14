import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jobService } from '../../services';
import { JOB_TYPES, JOB_CATEGORIES } from '../../models/JobModel';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import './JobsPage.css';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    status: 'active'
  });
  const { user, isEmployer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get filter parameters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    const typeParam = searchParams.get('type');

    if (categoryParam || typeParam) {
      setFilters(prev => ({
        ...prev,
        category: categoryParam || prev.category,
        type: typeParam || prev.type
      }));
    }
  }, [location.search]);

  // Load job listings
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        let fetchedJobs;
        if (isEmployer() && location.pathname.includes('/my-jobs')) {
          // Employer viewing their own job postings
          fetchedJobs = await jobService.getEmployerJobs(user.uid);
        } else {
          // Viewing all active job postings
          const activeFilters = { ...filters, status: 'active' };
          fetchedJobs = await jobService.getJobs(activeFilters);
        }
        
        setJobs(fetchedJobs);
        setError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('An error occurred while loading jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters, isEmployer, user, location.pathname]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Update URL
    const searchParams = new URLSearchParams(location.search);
    if (value) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  // Navigate to create job page
  const handleCreateJob = () => {
    navigate('/jobs/create');
  };

  return (
    <div className="jobs-page">
      <Header />
      <div className="container">
        <div className="jobs-header">
          <h1>Job Listings</h1>
          {isEmployer() && (
            <button className="btn-primary create-job-btn" onClick={handleCreateJob}>
              Create New Job
            </button>
          )}
        </div>

        <div className="jobs-filters">
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type">Job Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {JOB_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No job listings found.</h3>
            {isEmployer() && (
              <p>
                Click{' '}
                <button className="btn-link" onClick={handleCreateJob}>
                  here
                </button>{' '}
                to create your first job posting
              </p>
            )}
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <h3 className="job-title">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <span className="job-company">{job.company}</span>
                </div>
                <div className="job-card-content">
                  <p className="job-location">📍 {job.location}</p>
                  <p className="job-type">
                    {JOB_TYPES.find(t => t.id === job.type)?.label || job.type}
                  </p>
                  <p className="job-category">
                    {JOB_CATEGORIES.find(c => c.id === job.category)?.label || job.category}
                  </p>
                  {job.salary && job.salary.min > 0 && (
                    <p className="job-salary">
                      {job.salary.min} - {job.salary.max} {job.salary.currency}
                    </p>
                  )}
                </div>
                <div className="job-card-footer">
                  <span className="job-date">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                  <Link to={`/jobs/${job.id}`} className="view-job-btn">
                    Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage; 