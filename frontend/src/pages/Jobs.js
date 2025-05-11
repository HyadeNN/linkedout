import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    job_type: '',
    is_remote: null,
    min_salary: '',
    max_salary: ''
  });
  const [isEmployer, setIsEmployer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user is employer
  useEffect(() => {
    if (user) {
      setIsEmployer(user.role === 'employer' || user.role === 'admin');
    }
  }, [user]);

  // Fetch jobs
  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Prepare filters
      const filterParams = { ...filters };

      // Convert empty strings to null
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] === '') {
          filterParams[key] = null;
        }
      });

      // Search jobs with filters
      const response = await jobService.searchJobs(filterParams, page);

      if (page === 1) {
        setJobs(response.items);
      } else {
        setJobs(prevJobs => [...prevJobs, ...response.items]);
      }

      setTotalJobs(response.total);
      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset page to 1 when filters change
    setPage(1);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  // Handle save job
  const handleSaveJob = async (jobId) => {
    try {
      setActionLoading(true);

      const job = jobs.find(j => j.id === jobId);

      if (job.is_saved) {
        // Unsave job
        await jobService.removeSavedJob(jobId);
      } else {
        // Save job
        await jobService.saveJob(jobId);
      }

      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId ? { ...j, is_saved: !j.is_saved } : j
        )
      );
    } catch (error) {
      console.error('Failed to save/unsave job:', error);
      alert('Failed to save/unsave job. Please try again.');
    } finally {
      setActionLoading(false);
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
              <div className="filter-group">
                <label htmlFor="job_type">Job Type</label>
                <select
                  id="job_type"
                  name="job_type"
                  value={filters.job_type}
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
                  id="is_remote"
                  name="is_remote"
                  checked={filters.is_remote === true}
                  onChange={(e) => handleFilterChange({
                    target: {
                      name: 'is_remote',
                      value: e.target.checked,
                      type: 'checkbox',
                      checked: e.target.checked
                    }
                  })}
                />
                <label htmlFor="is_remote">Remote Jobs</label>
              </div>

              <div className="filter-group">
                <label htmlFor="min_salary">Minimum Salary</label>
                <input
                  type="number"
                  id="min_salary"
                  name="min_salary"
                  value={filters.min_salary}
                  onChange={handleFilterChange}
                  placeholder="Min"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="max_salary">Maximum Salary</label>
                <input
                  type="number"
                  id="max_salary"
                  name="max_salary"
                  value={filters.max_salary}
                  onChange={handleFilterChange}
                  placeholder="Max"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="jobs-content">
          {loading && jobs.length === 0 ? (
            <div className="loading-indicator">Searching for jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <h3>No jobs found</h3>
              <p>Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          ) : (
            <>
              <div className="jobs-count">
                Showing {jobs.length} of {totalJobs} jobs
              </div>

              <div className="jobs-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-info">
                      <h2 className="job-title">
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h2>
                      <p className="job-company">{job.company_name}</p>
                      <p className="job-location">
                        {job.location} {job.is_remote && '(Remote)'}
                      </p>

                      <div className="job-details">
                        <span className="job-type">{job.job_type}</span>

                        {(job.salary_min || job.salary_max) && (
                          <span className="job-salary">
                            {job.salary_min && job.salary_max
                              ? `${job.salary_min} - ${job.salary_max} ${job.currency}`
                              : job.salary_min
                              ? `From ${job.salary_min} ${job.currency}`
                              : `Up to ${job.salary_max} ${job.currency}`}
                          </span>
                        )}
                      </div>

                      <p className="job-date">
                        Posted on: {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="job-actions">
                      <Link to={`/jobs/${job.id}`} className="view-job-btn">
                        View Job
                      </Link>
                      <button
                        className={`save-job-btn ${job.is_saved ? 'saved' : ''}`}
                        onClick={() => handleSaveJob(job.id)}
                        disabled={actionLoading}
                      >
                        {job.is_saved ? 'Saved' : 'Save'}
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
                  {loading ? 'Loading...' : 'Load More'}
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