// JobModel.js - Model for job listings

/**
 * Data model for job listing
 */
export const JobModel = {
  id: '', // Firestore document ID
  title: '', // Job title
  company: '', // Company name
  employerId: '', // Employer user ID
  location: '', // Location
  type: '', // Full-time, part-time, remote, etc.
  description: '', // Job description
  requirements: [], // List of requirements
  salary: { // Salary information (optional)
    min: 0,
    max: 0,
    currency: 'TRY'
  },
  createdAt: null, // Creation date (Firestore timestamp)
  updatedAt: null, // Update date
  deadline: null, // Application deadline
  status: 'active', // active, closed, draft
  applicationCount: 0, // Number of applications
  viewCount: 0, // View count
  category: '', // Job category
  skills: [] // Required skills
};

/**
 * Data model for job application
 */
export const ApplicationModel = {
  id: '', // Firestore document ID
  jobId: '', // Job listing ID
  userId: '', // Applicant user ID 
  employerId: '', // Employer ID
  resumeUrl: '', // Resume URL
  coverLetter: '', // Cover letter
  status: 'pending', // pending, reviewed, accepted, rejected
  createdAt: null, // Application date
  updatedAt: null, // Last update
  notes: '', // Employer notes (internal)
  attachments: [], // Additional files
  answers: {} // Answers to application questions
};

/**
 * Job type constants
 */
export const JOB_TYPES = [
  { id: 'full-time', label: 'Full-Time' },
  { id: 'part-time', label: 'Part-Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'temporary', label: 'Temporary' },
  { id: 'remote', label: 'Remote' },
  { id: 'internship', label: 'Internship' }
];

/**
 * Job categories 
 */
export const JOB_CATEGORIES = [
  { id: 'software', label: 'Software Development' },
  { id: 'design', label: 'Design' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'finance', label: 'Finance' },
  { id: 'hr', label: 'Human Resources' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'other', label: 'Other' }
];

/**
 * Application status constants
 */
export const APPLICATION_STATUS = [
  { id: 'pending', label: 'Pending', color: 'blue' },
  { id: 'reviewed', label: 'Reviewed', color: 'orange' },
  { id: 'accepted', label: 'Accepted', color: 'green' },
  { id: 'rejected', label: 'Rejected', color: 'red' }
];

/**
 * Job status constants
 */
export const JOB_STATUS = [
  { id: 'active', label: 'Active', color: 'green' },
  { id: 'draft', label: 'Draft', color: 'gray' },
  { id: 'closed', label: 'Closed', color: 'red' },
  { id: 'paused', label: 'Paused', color: 'yellow' }
]; 