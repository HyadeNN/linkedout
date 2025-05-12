import React, { useState } from 'react';
import { profileService } from '../../services';
import { formatDateRange } from '../../utils/helpers';

const ExperienceSection = ({
  experiences = [],
  isEditable = false,
  onUpdate = () => {},
  onAddAbout = undefined,
  showAddAbout = false
}) => {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // If current position is checked, clear end date
    if (type === 'checkbox' && name === 'is_current' && checked) {
      setFormData(prev => ({
        ...prev,
        end_date: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    });
  };

  const handleEdit = (experience) => {
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      title: experience.title || '',
      company: experience.company || '',
      location: experience.location || '',
      start_date: formatDateForInput(experience.start_date),
      end_date: experience.is_current ? '' : formatDateForInput(experience.end_date),
      is_current: experience.is_current || false,
      description: experience.description || ''
    });

    setEditingId(experience.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = async (experienceId) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) {
      return;
    }

    try {
      setLoading(true);
      await profileService.deleteExperience(experienceId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete experience:', error);
      alert('Failed to delete experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title || !formData.company || !formData.start_date) {
      alert('Title, company and start date are required');
      return;
    }

    try {
      setLoading(true);

      if (isAdding) {
        await profileService.createExperience(formData);
      } else if (editingId) {
        await profileService.updateExperience(editingId, formData);
      }

      // Reset form and editing state
      resetForm();
      setEditingId(null);
      setIsAdding(false);

      // Callback to parent to refresh data
      onUpdate();
    } catch (error) {
      console.error('Failed to save experience:', error);
      alert('Failed to save experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderExperienceForm = () => (
    <form onSubmit={handleSubmit} className="experience-form">
      <div className="form-group">
        <label htmlFor="title">Title*</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ex: Software Engineer"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="company">Company*</label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Ex: Acme Inc."
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Ex: New York, NY"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date*</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            disabled={loading || formData.is_current}
          />
        </div>
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="is_current"
          name="is_current"
          checked={formData.is_current}
          onChange={handleChange}
          disabled={loading}
        />
        <label htmlFor="is_current">I am currently working here</label>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your role, achievements, etc."
          rows={4}
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="save-btn"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="experience-section">
      <div className="section-header">
        <h2 className="section-title">Experience</h2>
      </div>

      {(isAdding || editingId) && renderExperienceForm()}

      {experiences.length === 0 && !isAdding && !editingId ? (
        <div className="empty-section">
          <p>Add your work experience</p>
          {isEditable && (
            <div className="add-experience-container">
              <button
                className="add-experience-btn"
                onClick={() => setIsAdding(true)}
              >
                Add experience
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="experience-list">
          {experiences.map(experience => (
            <div key={experience.id} className="experience-item">
              <div className="experience-logo">
                <div className="company-logo-placeholder"></div>
              </div>
              <div className="experience-details">
                <h3 className="experience-title">{experience.title}</h3>
                <p className="experience-company">{experience.company}</p>
                <p className="experience-date">
                  {formatDateRange(experience.start_date, experience.end_date, experience.is_current)}
                </p>
                {experience.location && (
                  <p className="experience-location">{experience.location}</p>
                )}
                {experience.description && (
                  <p className="experience-description">{experience.description}</p>
                )}
              </div>
              {isEditable && !isAdding && !editingId && (
                <div className="item-actions">
                  <button
                    className="edit-item-btn"
                    onClick={() => handleEdit(experience)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDelete(experience.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddAbout && (
        <div className="add-about-container">
          <button
            className="add-about-btn"
            onClick={onAddAbout}
          >
            Add about
          </button>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;