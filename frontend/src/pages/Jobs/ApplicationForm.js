import React, { useState } from 'react';
import { jobService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import './ApplicationForm.css';

const ApplicationForm = ({ jobId, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    resumeFile: null
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resumePreview, setResumePreview] = useState('');
  const { user } = useAuth();

  // Form change handler
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'resumeFile' && files && files[0]) {
      // If file is selected
      const file = files[0];
      
      // File type validation
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          resumeFile: 'Please upload a PDF or Word file (.doc, .docx).'
        });
        return;
      }
      
      // File size validation (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          resumeFile: 'File size cannot exceed 5MB.'
        });
        return;
      }
      
      // File preview
      setFormData({
        ...formData,
        resumeFile: file
      });
      
      setResumePreview(file.name);
      
      // Clear errors if any
      if (errors.resumeFile) {
        setErrors({
          ...errors,
          resumeFile: null
        });
      }
    } else {
      // Text input change
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Clear errors if any
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: null
        });
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Please enter a cover letter.';
    }
    
    return newErrors;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");
    
    // Form validation
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      console.log("Form validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }
    
    try {
      setSubmitting(true);
      console.log("Submitting application with data:", formData);
      
      // Send application
      await jobService.applyToJob(jobId, user.uid, formData);
      console.log("Application submitted successfully");
      
      // Callback after successful submission
      if (onSubmit) {
        console.log("Calling onSubmit callback");
        onSubmit();
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setErrors({
        general: 'An error occurred while submitting your application. Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Remove resume file
  const handleRemoveResume = () => {
    setFormData({
      ...formData,
      resumeFile: null
    });
    setResumePreview('');
    
    // Clear errors if any
    if (errors.resumeFile) {
      setErrors({
        ...errors,
        resumeFile: null
      });
    }
  };

  return (
    <div className="application-form">
      <div className="application-form-header">
        <h2>Job Application</h2>
        <button 
          className="close-btn"
          onClick={onCancel}
          type="button"
          disabled={submitting}
        >
          &times;
        </button>
      </div>
      
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="coverLetter">Cover Letter*</label>
          <textarea
            id="coverLetter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            className={errors.coverLetter ? 'error' : ''}
            disabled={submitting}
            rows="6"
            placeholder="Introduce yourself and explain why you're a good fit for this position..."
          ></textarea>
          {errors.coverLetter && <span className="error-text">{errors.coverLetter}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="resumeFile">Resume</label>
          <div className="file-upload-container">
            <input
              type="file"
              id="resumeFile"
              name="resumeFile"
              onChange={handleChange}
              className={errors.resumeFile ? 'error' : ''}
              disabled={submitting}
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
            
            <div className="file-upload-box">
              {resumePreview ? (
                <div className="file-preview">
                  <span className="file-name">{resumePreview}</span>
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={handleRemoveResume}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => document.getElementById('resumeFile').click()}
                  disabled={submitting}
                >
                  Upload Resume (PDF, DOC, DOCX)
                </button>
              )}
            </div>
            
            {errors.resumeFile && <span className="error-text">{errors.resumeFile}</span>}
            <span className="form-hint">Uploading a resume is optional, but it strengthens your application.</span>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;