import React, { useState } from 'react';
import { jobService } from '../../services';

const JobSearch = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    location: initialFilters.location || '',
    job_type: initialFilters.job_type || '',
    is_remote: initialFilters.is_remote || false,
    min_salary: initialFilters.min_salary || '',
    max_salary: initialFilters.max_salary || ''
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSearching(true);

      // Prepare filters for API call
      const filterParams = { ...filters };

      // Convert empty strings to null
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] === '') {
          filterParams[key] = null;
        }
      });

      if (onSearch) {
        onSearch(filterParams);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleAdvancedMode = () => {
    setAdvancedMode(!advancedMode);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      location: '',
      job_type: '',
      is_remote: false,
      min_salary: '',
      max_salary: ''
    });
  };

  return (
    <div className="job-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-fields">
          <div className="form-group">
            <input
              type="text"
              name="query"
              value={filters.query}
              onChange={handleChange}
              placeholder="Search job titles, companies, or keywords"
              className="search-input"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleChange}
              placeholder="Location"
              className="location-input"
            />
          </div>

          <button
            type="button"
            className="toggle-advanced-btn"
            onClick={toggleAdvancedMode}
          >
            {advancedMode ? 'Simple Search' : 'Advanced Search'}
          </button>

          <button type="submit" className="search-btn" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {advancedMode && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label htmlFor="job_type">Job Type</label>
              <select
                id="job_type"
                name="job_type"
                value={filters.job_type}
                onChange={handleChange}
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
                checked={filters.is_remote}
                onChange={handleChange}
              />
              <label htmlFor="is_remote">Remote Jobs Only</label>
            </div>

            <div className="filter-group">
              <label htmlFor="min_salary">Minimum Salary</label>
              <input
                type="number"
                id="min_salary"
                name="min_salary"
                value={filters.min_salary}
                onChange={handleChange}
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
                onChange={handleChange}
                placeholder="Max"
              />
            </div>

            <button
              type="button"
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default JobSearch;