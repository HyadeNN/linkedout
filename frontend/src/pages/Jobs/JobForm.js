import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../../services';
import { JOB_TYPES, JOB_CATEGORIES, JOB_STATUS, JobModel } from '../../models/JobModel';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import './JobForm.css';

const JobForm = () => {
  const { jobId } = useParams();
  const isEditing = !!jobId;
  const [formData, setFormData] = useState({ ...JobModel });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [skills, setSkills] = useState('');
  const { user, isEmployer } = useAuth();
  const navigate = useNavigate();

  // Load job posting (for edit mode)
  useEffect(() => {
    if (!isEmployer()) {
      navigate('/jobs');
      return;
    }

    if (isEditing) {
      const fetchJob = async () => {
        try {
          setLoading(true);
          const job = await jobService.getJob(jobId);
          
          // Redirect if job doesn't belong to the user
          if (job.employerId !== user.uid) {
            navigate('/jobs');
            return;
          }
          
          // Load job data into the form
          setFormData({
            ...job,
            requirements: job.requirements || [],
            skills: job.skills || [],
            deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
          });
          
          // Convert requirements and skills arrays to strings
          setRequirements(job.requirements ? job.requirements.join('\n') : '');
          setSkills(job.skills ? job.skills.join(', ') : '');
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching job:', err);
          navigate('/jobs');
        }
      };
      
      fetchJob();
    } else {
      // Default values for new job posting
      const companyName = user.company_name || '';
      setFormData({
        ...JobModel,
        company: companyName,
        employerId: user.uid,
        status: 'active'
      });
    }
  }, [jobId, isEditing, user, navigate, isEmployer]);

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'requirements') {
      setRequirements(value);
    } else if (name === 'skills') {
      setSkills(value);
    } else if (name.startsWith('salary.')) {
      const salaryField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        salary: {
          ...prev.salary,
          [salaryField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.type) newErrors.type = 'Job type is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (formData.salary.min && formData.salary.max) {
      if (Number(formData.salary.min) > Number(formData.salary.max)) {
        newErrors['salary.min'] = 'Minimum salary cannot be greater than maximum salary';
      }
    }
    
    return newErrors;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare requirements and skills arrays
      const requirementsList = requirements
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const skillsList = skills
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const jobData = {
        ...formData,
        requirements: requirementsList,
        skills: skillsList,
        salary: {
          min: Number(formData.salary.min) || 0,
          max: Number(formData.salary.max) || 0,
          currency: formData.salary.currency || 'TRY'
        }
      };
      
      if (isEditing) {
        // Update existing job
        await jobService.updateJob(jobId, jobData);
      } else {
        // Create new job
        await jobService.createJob(user.uid, jobData);
      }
      
      // Redirect after successful submission
      navigate('/jobs/my-jobs');
    } catch (err) {
      console.error('Error submitting job:', err);
      setErrors({ general: 'An error occurred while saving the job posting. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="job-form-page">
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading job posting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-form-page">
      <Header />
      <div className="container">
        <div className="job-form-header">
          <h1>{isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}</h1>
          <button 
            className="btn-secondary" 
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Go Back
          </button>
        </div>

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form className="job-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Job Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={errors.title ? 'error' : ''}
                disabled={submitting}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="company">Company Name*</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={errors.company ? 'error' : ''}
                disabled={true}
                readOnly
              />
              {errors.company && <span className="error-text">{errors.company}</span>}
              <small className="form-hint">Company name is set from your employer profile</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location*</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={errors.location ? 'error' : ''}
                disabled={submitting}
                placeholder="Istanbul, Turkey"
              />
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="type">Job Type*</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={errors.type ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select</option>
                {JOB_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <span className="error-text">{errors.type}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category*</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={errors.category ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select</option>
                {JOB_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
              >
                {JOB_STATUS.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salary.min">Minimum Salary</label>
              <input
                type="number"
                id="salary.min"
                name="salary.min"
                value={formData.salary.min}
                onChange={handleChange}
                className={errors['salary.min'] ? 'error' : ''}
                disabled={submitting}
                min="0"
              />
              {errors['salary.min'] && <span className="error-text">{errors['salary.min']}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="salary.max">Maximum Salary</label>
              <input
                type="number"
                id="salary.max"
                name="salary.max"
                value={formData.salary.max}
                onChange={handleChange}
                disabled={submitting}
                min="0"
              />
            </div>

            <div className="form-group salary-currency">
              <label htmlFor="salary.currency">Currency</label>
              <select
                id="salary.currency"
                name="salary.currency"
                value={formData.salary.currency}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Application Deadline</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline || ''}
              onChange={handleChange}
              disabled={submitting}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description*</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              disabled={submitting}
              rows="5"
              placeholder="Provide detailed information about the position..."
            ></textarea>
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              value={requirements}
              onChange={handleChange}
              disabled={submitting}
              rows="5"
              placeholder="Write one requirement per line..."
            ></textarea>
            <small className="form-hint">Write one requirement per line</small>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Required Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={skills}
              onChange={handleChange}
              disabled={submitting}
              placeholder="React, JavaScript, CSS, ..."
            />
            <small className="form-hint">Separate skills with commas</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Publish Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm; 