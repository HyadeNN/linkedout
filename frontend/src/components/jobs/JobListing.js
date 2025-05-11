import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services';

const JobListing = ({ job, onSaveToggle, disableSaveButton = false }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToggle = async () => {
    if (disableSaveButton) return;

    try {
      setIsSaving(true);
      if (job.is_saved) {
        await jobService.removeSavedJob(job.id);
      } else {
        await jobService.saveJob(job.id);
      }

      if (onSaveToggle) {
        onSaveToggle(job.id, !job.is_saved);
      }
    } catch (error) {
      console.error('Failed to toggle job save status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;

    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency}`;
    } else if (job.salary_min) {
      return `From ${job.salary_min.toLocaleString()} ${job.currency}`;
    } else {
      return `Up to ${job.salary_max.toLocaleString()} ${job.currency}`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="job-card">
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

          {formatSalary() && (
            <span className="job-salary">{formatSalary()}</span>
          )}
        </div>

        <p className="job-posted">
          Posted: {formatDate(job.created_at)}
        </p>
      </div>

      <div className="job-actions">
        <Link to={`/jobs/${job.id}`} className="view-job-btn">
          View Details
        </Link>
        <button
          className={`save-job-btn ${job.is_saved ? 'saved' : ''}`}
          onClick={handleSaveToggle}
          disabled={isSaving || disableSaveButton}
        >
          {job.is_saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default JobListing;