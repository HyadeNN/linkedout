import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getMyJobPostings(page);

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

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        setDeleting(true);
        await jobService.deleteJob(jobId);

        // Remove the deleted job from the list
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        setTotalJobs(prevTotal => prevTotal - 1);

        alert('Job deleted successfully!');
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete job. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="my-jobs-page">
      <div className="page-header">
        <h1 className="page-title">My Job Postings</h1>
        <Link to="/jobs/create" className="create-job-button">
          Post New Job
        </Link>
      </div>

      <div className="page-content">
        {loading && jobs.length === 0 ? (
          <div className="loading-indicator">Loading your job postings...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No job postings yet</h3>
            <p>Create your first job posting to find the perfect candidate for your position.</p>
            <Link to="/jobs/create" className="primary-button">
              Post a Job
            </Link>
          </div>
        ) : (
          <>
            <div className="jobs-count">
              Showing {jobs.length} of {totalJobs} job postings
            </div>

            <div className="job-list">
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
                    <p className="job-type">{job.job_type}</p>

                    <div className="job-applications">
                      <span className="applications-count">
                        Applications: {job.applications_count || 0}
                      </span>
                      {job.applications_count > 0 && (
                        <Link to={`/jobs/${job.id}/applications`} className="view-applications">
                          View Applications
                        </Link>
                      )}
                    </div>

                    <div className="job-status">
                      <span className={`status-indicator ${job.is_active ? 'active' : 'inactive'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="job-actions">
                    <Link to={`/jobs/edit/${job.id}`} className="edit-job-button">
                      Edit
                    </Link>
                    <button
                      className="delete-job-button"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                className="load-more-button"
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
  );
};

export default MyJobs;