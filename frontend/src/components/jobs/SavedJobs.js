import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services';
import JobListing from './JobListing';

const SavedJobs = ({ limit = 5, showViewAll = true }) => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    fetchSavedJobs();
  }, [limit]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await jobService.getSavedJobs(1, limit);
      setSavedJobs(response.items.map(item => ({
        ...item.job,
        is_saved: true
      })));
      setTotalSaved(response.total);
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
      setError('Failed to load saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async (jobId, isSaved) => {
    // If job is being un-saved, remove it from the list
    if (!isSaved) {
      setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      setTotalSaved(prev => prev - 1);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading saved jobs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (savedJobs.length === 0) {
    return (
      <div className="saved-jobs-empty">
        <h3>No saved jobs</h3>
        <p>Jobs you save will appear here</p>
        <Link to="/jobs" className="browse-jobs-link">Browse Jobs</Link>
      </div>
    );
  }

  return (
    <div className="saved-jobs-component">
      <div className="saved-jobs-header">
        <h2>Saved Jobs {totalSaved > 0 && `(${totalSaved})`}</h2>
        {showViewAll && totalSaved > limit && (
          <Link to="/jobs/saved" className="view-all-link">
            View All
          </Link>
        )}
      </div>

      <div className="saved-jobs-list">
        {savedJobs.map(job => (
          <JobListing
            key={job.id}
            job={job}
            onSaveToggle={handleSaveToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedJobs;