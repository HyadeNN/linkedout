import React, { useState } from 'react';
import { profileService } from '../../services';
import { formatDateRange } from '../../utils/helpers';

const EducationSection = ({
  educations = [],
  isEditable = false,
  onUpdate = () => {}
}) => {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field_of_study: '',
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

    // If current education is checked, clear end date
    if (type === 'checkbox' && name === 'is_current' && checked) {
      setFormData(prev => ({
        ...prev,
        end_date: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      school: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    });
  };

  const handleEdit = (education) => {
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      school: education.school || '',
      degree: education.degree || '',
      field_of_study: education.field_of_study || '',
      start_date: formatDateForInput(education.start_date),
      end_date: education.is_current ? '' : formatDateForInput(education.end_date),
      is_current: education.is_current || false,
      description: education.description || ''
    });

    setEditingId(education.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = async (educationId) => {
    if (!window.confirm('Are you sure you want to delete this education?')) {
      return;
    }

    try {
      setLoading(true);
      await profileService.deleteEducation(educationId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete education:', error);
      alert('Failed to delete education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.school || !formData.start_date) {
      alert('School and start date are required');
      return;
    }

    try {
      setLoading(true);

      if (isAdding) {
        await profileService.createEducation(formData);
      } else if (editingId) {
        await profileService.updateEducation(editingId, formData);
      }

      // Reset form and editing state
      resetForm();
      setEditingId(null);
      setIsAdding(false);

      // Callback to parent to refresh data
      onUpdate();
    } catch (error) {
      console.error('Failed to save education:', error);
      alert('Failed to save education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEducationForm = () => (
    <form onSubmit={handleSubmit} className="education-form">
      <div className="form-group">
        <label htmlFor="school">School*</label>
        <input
          type="text"
          id="school"
          name="school"
          value={formData.school}
          onChange={handleChange}
          placeholder="School name"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="degree">Degree</label>
        <input
          type="text"
          id="degree"
          name="degree"
          value={formData.degree}
          onChange={handleChange}
          placeholder="Ex: Bachelor's"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="field_of_study">Field of Study</label>
        <input
          type="text"
          id="field_of_study"
          name="field_of_study"
          value={formData.field_of_study}
          onChange={handleChange}
          placeholder="Ex: Computer Science"
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
        <label htmlFor="is_current">I am currently studying here</label>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your studies, achievements, etc."
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
    <div className="education-section">
      <div className="section-header">
        <h2 className="section-title">Education</h2>
        {isEditable && !isAdding && !editingId && (
          <button
            className="add-item-btn"
            onClick={() => setIsAdding(true)}
            disabled={loading}
          >
            <span className="add-icon">+</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && renderEducationForm()}

      {educations.length === 0 && !isAdding && !editingId ? (
        <div className="empty-section">
          <p>Add your education</p>
          {isEditable && (
            <button
              className="add-education-btn"
              onClick={() => setIsAdding(true)}
            >
              Add education
            </button>
          )}
        </div>
      ) : (
        <div className="education-list">
          {educations.map(education => (
            <div key={education.id} className="education-item">
              <div className="education-logo">
                <div className="school-logo-placeholder"></div>
              </div>
              <div className="education-details">
                <h3 className="education-school">{education.school}</h3>
                {(education.degree || education.field_of_study) && (
                  <p className="education-degree">
                    {education.degree}{education.field_of_study ? `, ${education.field_of_study}` : ''}
                  </p>
                )}
                <p className="education-date">
                  {formatDateRange(education.start_date, education.end_date, education.is_current)}
                </p>
                {education.description && (
                  <p className="education-description">{education.description}</p>
                )}
              </div>
              {isEditable && !isAdding && !editingId && (
                <div className="item-actions">
                  <button
                    className="edit-item-btn"
                    onClick={() => handleEdit(education)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDelete(education.id)}
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
    </div>
  );
};

export default EducationSection;