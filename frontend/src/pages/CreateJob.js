import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services';
import './CreateJob.css';

const CreateJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'full-time',
    isRemote: false,
    description: '',
    requirements: '',
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    deadline: '',
    applicationCount: 0,
    viewCount: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    // Check if user is employer
    const checkUserRole = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== 'employer' && userData.role !== 'admin') {
            alert('You do not have permission to post jobs');
            navigate('/jobs');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
      }
    };

    checkUserRole();

    // If jobId is provided, we're in edit mode
    if (jobId) {
      setIsEditMode(true);
      fetchJobDetails();
    }
  }, [user, jobId, navigate]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      
      if (!jobDoc.exists()) {
        alert('Job not found');
        navigate('/jobs');
        return;
      }
      
      const jobData = jobDoc.data();
      
      // Check if user is the owner of this job
      if (jobData.employerId !== user.uid) {
        alert('You do not have permission to edit this job');
        navigate('/jobs');
        return;
      }
      
      // Format job data for form
      setFormData({
        title: jobData.title || '',
        company: jobData.company || '',
        location: jobData.location || '',
        jobType: jobData.jobType || 'full-time',
        isRemote: jobData.isRemote || false,
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        salary: {
          min: jobData.salary?.min || '',
          max: jobData.salary?.max || '',
          currency: jobData.salary?.currency || 'USD'
        },
        deadline: jobData.deadline ? new Date(jobData.deadline.toDate()).toISOString().split('T')[0] : '',
        applicationCount: jobData.applicationCount || 0,
        viewCount: jobData.viewCount || 0
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      alert('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('salary.')) {
      const salaryField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        salary: {
          ...prev.salary,
          [salaryField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Clear submit error when form is changed
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    
    if (!formData.company.trim()) {
      errors.company = 'Company name is required';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    }
    
    if (formData.salary.min && formData.salary.max && 
        parseFloat(formData.salary.min) > parseFloat(formData.salary.max)) {
      errors['salary.min'] = 'Minimum salary cannot be greater than maximum salary';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError('');
      
      // Get user's company information
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Prepare job data
      const jobData = {
        title: formData.title,
        company: formData.company || userData.company_name || '',
        location: formData.location,
        jobType: formData.jobType,
        isRemote: formData.isRemote,
        description: formData.description,
        requirements: formData.requirements,
        salary: {
          min: formData.salary.min ? parseFloat(formData.salary.min) : null,
          max: formData.salary.max ? parseFloat(formData.salary.max) : null,
          currency: formData.salary.currency
        },
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        employerId: user.uid,
        employerName: userData.displayName || userData.name || user.displayName || '',
        employerImage: userData.photoURL || user.photoURL || '',
        status: 'active'
      };
      
      if (isEditMode) {
        // Use the jobService to update the job
        await jobService.updateJob(jobId, jobData);
        alert('Job updated successfully!');
      } else {
        // Use the jobService to create the job
        await jobService.createJob(user.uid, jobData);
        alert('Job posted successfully!');
      }
      
      navigate('/jobs/my-jobs');
    } catch (error) {
      console.error('Error submitting job:', error);
      setSubmitError(`Failed to ${isEditMode ? 'update' : 'post'} job: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-job-page">
        <div className="loading-indicator">Loading job details...</div>
      </div>
    );
  }

  return (
    <div className="create-job-page">
      <div className="create-job-container">
        <h1 className="page-title">{isEditMode ? 'Edit Job Posting' : 'Post a New Job'}</h1>
        
        {submitError && (
          <div className="error-message alert alert-danger">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">
                Job Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                disabled={submitting}
              />
              {formErrors.title && <div className="form-error">{formErrors.title}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="company">
                Company Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-control"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Acme Inc."
                disabled={submitting}
              />
              {formErrors.company && <div className="form-error">{formErrors.company}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="location">
                Location <span className="required">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY"
                disabled={submitting}
              />
              {formErrors.location && <div className="form-error">{formErrors.location}</div>}
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isRemote"
                name="isRemote"
                checked={formData.isRemote}
                onChange={handleChange}
                disabled={submitting}
              />
              <label htmlFor="isRemote">This is a remote position</label>
            </div>
            
            <div className="form-group">
              <label htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                name="jobType"
                className="form-control"
                value={formData.jobType}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="deadline">Application Deadline</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                className="form-control"
                value={formData.deadline}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className="form-section">
            <h2 className="section-title">Salary Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary.min">Minimum Salary</label>
                <input
                  type="number"
                  id="salary.min"
                  name="salary.min"
                  className="form-control"
                  value={formData.salary.min}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  disabled={submitting}
                />
                {formErrors['salary.min'] && <div className="form-error">{formErrors['salary.min']}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="salary.max">Maximum Salary</label>
                <input
                  type="number"
                  id="salary.max"
                  name="salary.max"
                  className="form-control"
                  value={formData.salary.max}
                  onChange={handleChange}
                  placeholder="e.g. 80000"
                  disabled={submitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="salary.currency">Currency</label>
                <select
                  id="salary.currency"
                  name="salary.currency"
                  className="form-control"
                  value={formData.salary.currency}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2 className="section-title">Job Details</h2>
            
            <div className="form-group">
              <label htmlFor="description">
                Job Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the responsibilities and details of the job..."
                rows={8}
                disabled={submitting}
              />
              {formErrors.description && <div className="form-error">{formErrors.description}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements">Job Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                className="form-control"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List the skills, experience, and qualifications required..."
                rows={8}
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/jobs')}
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting
                ? (isEditMode ? 'Updating...' : 'Posting...')
                : (isEditMode ? 'Update Job' : 'Post Job')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;