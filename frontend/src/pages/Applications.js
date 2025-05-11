import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobService.getMyApplications(page);

      if (page === 1) {
        setApplications(response.items);
      } else {
        setApplications(prevApps => [...prevApps, ...response.items]);
      }

      setTotalApplications(response.total);
      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'interviewing':
        return 'status-interviewing';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return '';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1 className="page-title">My Applications</h1>
        <Link to="/jobs" className="browse-jobs-button">
          Find More Jobs
        </Link>
      </div>

      <div className="page-content">
        {loading && applications.length === 0 ? (
          <div className="loading-indicator">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <h3>No job applications yet</h3>
            <p>Apply to jobs to track your application status and progress.</p>
            <Link to="/jobs" className="primary-button">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <>
            <div className="applications-count">
              Showing {applications.length} of {totalApplications} applications
            </div>

            <div className="applications-list">
              {applications.map(application => (
                <div key={application.id} className="application-card">
                  <div className="application-info">
                    <h2 className="job-title">
                      <Link to={`/jobs/${application.job_id}`}>{application.job.title}</Link>
                    </h2>
                    <p className="job-company">{application.job.company_name}</p>
                    <p className="job-location">
                      {application.job.location} {application.job.is_remote && '(Remote)'}
                    </p>

                    <div className="application-details">
                      <div className="application-status">
                        <span className="status-label">Status:</span>
                        <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                          {formatStatus(application.status)}
                        </span>
                      </div>

                      <div className="application-date">
                        <span className="date-label">Applied on:</span>
                        <span className="date-value">
                          {new Date(application.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {application.cover_letter && (
                      <div className="cover-letter">
                        <h3 className="cover-letter-title">Cover Letter</h3>
                        <p className="cover-letter-content">{application.cover_letter}</p>
                      </div>
                    )}
                  </div>

                  <div className="application-actions">
                    <Link to={`/jobs/${application.job_id}`} className="view-job-button">
                      View Job
                    </Link>
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

export default Applications;