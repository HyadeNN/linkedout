import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalSaved, setTotalSaved] = useState(0);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, [page]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getSavedJobs(page);

      if (page === 1) {
        setSavedJobs(response.items);
      } else {
        setSavedJobs(prevJobs => [...prevJobs, ...response.items]);
      }

      setTotalSaved(response.total);
      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleRemoveSaved = async (jobId) => {
    try {
      setRemoving(true);
      await jobService.removeSavedJob(jobId);

      // Remove the job from the list
      setSavedJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
      setTotalSaved(prevTotal => prevTotal - 1);
    } catch (error) {
      console.error('Failed to remove saved job:', error);
      alert('Failed to remove job from saved list. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="saved-jobs-page">
      <div className="page-header">
        <h1 className="page-title">Saved Jobs</h1>
        <Link to="/jobs" className="browse-jobs-button">
          Browse Jobs
        </Link>
      </div>

      <div className="page-content">
        {loading && savedJobs.length === 0 ? (
          <div className="loading-indicator">Loading saved jobs...</div>
        ) : savedJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No saved jobs yet</h3>
            <p>Save jobs that interest you to apply later or keep track of your job search.</p>
            <Link to="/jobs" className="primary-button">
              Find Jobs
            </Link>
          </div>
        ) : (
          <>
            <div className="jobs-count">
              Showing {savedJobs.length} of {totalSaved} saved jobs
            </div>

            <div className="job-list">
              {savedJobs.map(savedJob => {
                const job = savedJob.job;
                return (
                  <div key={savedJob.id} className="job-card">
                    <div className="job-info">
                      <h2 className="job-title">
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h2>
                      <p className="job-company">{job.company_name}</p>
                      <p className="job-location">
                        {job.location} {job.is_remote && '(Remote)'}
                      </p>
                      <p className="job-type">{job.job_type}</p>

                      {(job.salary_min || job.salary_max) && (
                        <p className="job-salary">
                          {job.salary_min && job.salary_max
                            ? `${job.salary_min} - ${job.salary_max} ${job.currency}`
                            : job.salary_min
                            ? `From ${job.salary_min} ${job.currency}`
                            : `Up to ${job.salary_max} ${job.currency}`}
                        </p>
                      )}

                      <p className="job-date">
                        Saved on: {new Date(savedJob.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="job-actions">
                      <Link to={`/jobs/${job.id}`} className="view-job-button">
                        View Job
                      </Link>
                      <button
                        className="unsave-job-button"
                        onClick={() => handleRemoveSaved(job.id)}
                        disabled={removing}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
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

export default SavedJobs;