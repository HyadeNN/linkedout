import { db, storage } from '../firebase';
import { 
  collection, addDoc, getDocs, getDoc, doc, query, 
  where, orderBy, serverTimestamp, updateDoc, deleteDoc,
  limit, startAfter, increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

// Create a job posting
export const createJob = async (employerId, jobData) => {
  try {
    // Get the employer's company name from their user profile
    const employerDoc = await getDoc(doc(db, 'users', employerId));
    if (!employerDoc.exists()) {
      throw new Error('Employer not found');
    }
    
    const employerData = employerDoc.data();
    const companyName = employerData.company_name || jobData.company || '';
    
    // Convert deadline string to Timestamp if provided
    let deadline = null;
    if (jobData.deadline) {
      deadline = new Date(jobData.deadline);
      // Only use it if it's a valid date
      if (isNaN(deadline.getTime())) {
        deadline = null;
      }
    }
    
    // Prepare job data
    const job = {
      ...jobData,
      employerId,
      company: companyName, // Always use the company name from the employer profile
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      status: jobData.status || 'active',
      applicationCount: 0,
      viewCount: 0
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'jobs'), job);
    
    return {
      id: docRef.id,
      ...job
    };
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update a job posting
export const updateJob = async (jobId, jobData) => {
  try {
    // Get the current job to get the employer ID
    const jobDoc = await getDoc(doc(db, 'jobs', jobId));
    if (!jobDoc.exists()) {
      throw new Error('Job not found');
    }
    
    const currentJob = jobDoc.data();
    const employerId = currentJob.employerId;
    
    // Get the employer's company name from their user profile
    const employerDoc = await getDoc(doc(db, 'users', employerId));
    if (!employerDoc.exists()) {
      throw new Error('Employer not found');
    }
    
    const employerData = employerDoc.data();
    const companyName = employerData.company_name || currentJob.company || '';
    
    // Convert deadline string to Timestamp if provided
    let deadline = null;
    if (jobData.deadline) {
      deadline = new Date(jobData.deadline);
      // Only use it if it's a valid date
      if (isNaN(deadline.getTime())) {
        deadline = null;
      }
    }
    
    // Prepare update data, ensuring company name remains consistent
    const updateData = {
      ...jobData,
      company: companyName, // Always use the company name from the employer profile
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      updatedAt: serverTimestamp()
    };
    
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, updateData);

    return {
      id: jobId,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

// Delete a job posting
export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Get job details
export const getJob = async (jobId) => {
  try {
    const jobDoc = await getDoc(doc(db, 'jobs', jobId));
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found');
    }
    
    const jobData = jobDoc.data();
    
    // Get employer information
    const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
    const employerData = employerDoc.exists() ? employerDoc.data() : null;
    
    // Safely convert timestamps
    let deadlineDate = null;
    if (jobData.deadline) {
      try {
        deadlineDate = jobData.deadline.toDate();
      } catch (e) {
        // If it's not a Firestore timestamp
        deadlineDate = new Date(jobData.deadline);
        if (isNaN(deadlineDate.getTime())) {
          deadlineDate = null;
        }
      }
    }
    
    return {
      id: jobDoc.id,
      ...jobData,
      employer: employerData ? {
        id: employerData.id,
        name: employerData.name,
        profile_image: employerData.profile?.profile_image
      } : null,
      createdAt: jobData.createdAt?.toDate(),
      updatedAt: jobData.updatedAt?.toDate(),
      deadline: deadlineDate
    };
  } catch (error) {
    console.error('Error getting job:', error);
    throw error;
  }
};

// Get list of jobs
export const getJobs = async (filters = {}) => {
  try {
    let jobsQuery = collection(db, 'jobs');
    const queryFilters = [];
    
    // Apply filters
    if (filters.status) {
      queryFilters.push(where('status', '==', filters.status));
    }
    
    if (filters.category) {
      queryFilters.push(where('category', '==', filters.category));
    }
    
    if (filters.type) {
      queryFilters.push(where('type', '==', filters.type));
    }
    
    if (filters.employerId) {
      queryFilters.push(where('employerId', '==', filters.employerId));
    }
    
    // Create query
    if (queryFilters.length > 0) {
      jobsQuery = query(
        jobsQuery,
        ...queryFilters,
        orderBy('createdAt', 'desc')
      );
    } else {
      jobsQuery = query(
        jobsQuery,
        orderBy('createdAt', 'desc')
      );
    }
    
    // Pagination limit
    if (filters.limit) {
      jobsQuery = query(jobsQuery, limit(filters.limit));
    }
    
    // Pagination start point
    if (filters.startAfter) {
      jobsQuery = query(jobsQuery, startAfter(filters.startAfter));
    }
    
    const snapshot = await getDocs(jobsQuery);
    
    // Return job list
    const jobs = await Promise.all(
      snapshot.docs.map(async (jobDoc) => {
        const jobData = jobDoc.data();
        
        // Get employer information
        const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
        const employerData = employerDoc.exists() ? employerDoc.data() : null;
        
        // Safely convert deadline
        let deadlineDate = null;
        if (jobData.deadline) {
          try {
            deadlineDate = jobData.deadline.toDate();
          } catch (e) {
            // If it's not a Firestore timestamp
            deadlineDate = new Date(jobData.deadline);
            if (isNaN(deadlineDate.getTime())) {
              deadlineDate = null;
            }
          }
        }
        
        return {
          id: jobDoc.id,
          ...jobData,
          employer: employerData ? {
            id: employerData.id,
            name: employerData.name,
            profile_image: employerData.profile?.profile_image
          } : null,
          createdAt: jobData.createdAt?.toDate(),
          updatedAt: jobData.updatedAt?.toDate(),
          deadline: deadlineDate
        };
      })
    );
    
    return jobs;
  } catch (error) {
    console.error('Error getting jobs:', error);
    throw error;
  }
};

// Get employer's job listings
export const getEmployerJobs = async (employerId) => {
  return getJobs({ employerId });
};

// Apply to a job
export const applyToJob = async (jobId, userId, applicationData) => {
  try {
    console.log("applyToJob called with:", { jobId, userId, applicationData });
    
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Check job exists
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      console.error("Job not found:", jobId);
      throw new Error('İş ilanı bulunamadı');
    }
    
    const jobData = jobDoc.data();
    console.log("Job data:", jobData);
    
    // Check if user has already applied to this job
    const existingApplicationsQuery = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      where('userId', '==', userId)
    );
    
    const existingApplications = await getDocs(existingApplicationsQuery);
    
    if (!existingApplications.empty) {
      console.log("User has already applied to this job");
      return {
        id: existingApplications.docs[0].id,
        ...existingApplications.docs[0].data(),
        alreadyApplied: true
      };
    }
    
    // Upload resume file (if exists)
    let resumeUrl = applicationData.resumeUrl || '';
    if (applicationData.resumeFile) {
      try {
        console.log("Uploading resume file:", applicationData.resumeFile.name);
        const fileName = `${userId}_${Date.now()}_${applicationData.resumeFile.name}`;
        const storageRef = ref(storage, `resumes/${userId}/${fileName}`);
        await uploadBytes(storageRef, applicationData.resumeFile);
        resumeUrl = await getDownloadURL(storageRef);
        console.log("Resume uploaded successfully, URL:", resumeUrl);
      } catch (uploadError) {
        console.error("Error uploading resume:", uploadError);
        // Continue without resume if upload fails
      }
    }
    
    // Get employer ID from job data
    const employerId = jobData.employerId;
    if (!employerId) {
      throw new Error('İş ilanının sahibi bulunamadı');
    }
    
    // Prepare application data
    const application = {
      jobId,
      userId,
      employerId,
      resumeUrl,
      coverLetter: applicationData.coverLetter || '',
      phone: applicationData.phone || '',
      experience: applicationData.experience || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: '',
      attachments: [],
      answers: applicationData.answers || {},
      job_title: jobData.title || 'Untitled Job'
    };
    
    console.log("Saving application:", application);
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, 'applications'), application);
    console.log("Application saved with ID:", docRef.id);
    
    // Update job application count
    try {
      await updateDoc(jobRef, {
        applicationCount: increment(1)
      });
      console.log("Job application count incremented");
    } catch (counterError) {
      console.error("Error incrementing application count:", counterError);
      // Continue even if counter update fails
    }
    
    return {
      id: docRef.id,
      ...application,
      success: true
    };
  } catch (error) {
    console.error('Error applying to job:', error);
    throw error;
  }
};

// Get job applications
export const getApplications = async (filters = {}) => {
  try {
    let applicationsQuery = collection(db, 'applications');
    const queryFilters = [];
    
    // Apply filters
    if (filters.jobId) {
      queryFilters.push(where('jobId', '==', filters.jobId));
    }
    
    if (filters.userId) {
      queryFilters.push(where('userId', '==', filters.userId));
    }
    
    if (filters.employerId) {
      queryFilters.push(where('employerId', '==', filters.employerId));
    }
    
    if (filters.status) {
      queryFilters.push(where('status', '==', filters.status));
    }
    
    // Create query
    if (queryFilters.length > 0) {
      applicationsQuery = query(
        applicationsQuery,
        ...queryFilters,
        orderBy('createdAt', 'desc')
      );
    } else {
      applicationsQuery = query(
        applicationsQuery,
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(applicationsQuery);
    
    // Return applications
    const applications = await Promise.all(
      snapshot.docs.map(async (applicationDoc) => {
        const applicationData = applicationDoc.data();
        
        // Get user information
        const userDoc = await getDoc(doc(db, 'users', applicationData.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // Get job information
        const jobDoc = await getDoc(doc(db, 'jobs', applicationData.jobId));
        const jobData = jobDoc.exists() ? jobDoc.data() : null;
        
        return {
          id: applicationDoc.id,
          ...applicationData,
          user: userData ? {
            id: userData.id,
            name: userData.name,
            headline: userData.headline,
            profile_image: userData.profile?.profile_image
          } : null,
          job: jobData ? {
            id: applicationData.jobId,
            title: jobData.title,
            company: jobData.company
          } : null,
          createdAt: applicationData.createdAt?.toDate(),
          updatedAt: applicationData.updatedAt?.toDate()
        };
      })
    );
    
    return applications;
  } catch (error) {
    console.error('Error getting applications:', error);
    throw error;
  }
};

// Update application status
export const updateApplicationStatus = async (applicationId, status, notes = '') => {
  try {
    const applicationRef = doc(db, 'applications', applicationId);
    
    await updateDoc(applicationRef, {
      status,
      notes,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Increment job view count
export const incrementJobViews = async (jobId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    
    await updateDoc(jobRef, {
      viewCount: increment(1)
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing job views:', error);
    return false;
  }
};

// Get user's job applications
export const getMyApplications = async (userId, page = 1, pageSize = 10) => {
  try {
    const applications = await getApplications({ userId });
    
    // Manual pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = applications.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: applications.length,
      has_next: endIndex < applications.length,
      page
    };
  } catch (error) {
    console.error('Error getting user applications:', error);
    throw error;
  }
};

// Search for jobs with filters
export const searchJobs = async (filters = {}, page = 1, pageSize = 10) => {
  try {
    // Get all jobs first
    const allJobs = await getJobs();
    
    // Filter jobs client-side
    let filteredJobs = [...allJobs];
    
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        (job.description && job.description.toLowerCase().includes(query))
      );
    }
    
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location)
      );
    }
    
    if (filters.job_type) {
      filteredJobs = filteredJobs.filter(job => 
        job.type === filters.job_type
      );
    }
    
    if (filters.is_remote === true) {
      filteredJobs = filteredJobs.filter(job => 
        job.isRemote === true
      );
    }
    
    if (filters.min_salary) {
      const minSalary = parseInt(filters.min_salary);
      filteredJobs = filteredJobs.filter(job => 
        job.salary && job.salary.min >= minSalary
      );
    }
    
    if (filters.max_salary) {
      const maxSalary = parseInt(filters.max_salary);
      filteredJobs = filteredJobs.filter(job => 
        job.salary && job.salary.max <= maxSalary
      );
    }
    
    // Manual pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredJobs.slice(startIndex, endIndex);
    
    // Add is_saved field
    const jobsWithSavedStatus = await Promise.all(
      paginatedItems.map(async (job) => {
        let isSaved = false;
        
        if (filters.userId) {
          // Check if job is saved by user
          const savedJobsSnapshot = await getDocs(
            query(
              collection(db, 'savedJobs'), 
              where('userId', '==', filters.userId),
              where('jobId', '==', job.id)
            )
          );
          isSaved = !savedJobsSnapshot.empty;
        }
        
        return {
          ...job,
          is_saved: isSaved
        };
      })
    );
    
    return {
      items: jobsWithSavedStatus,
      total: filteredJobs.length,
      has_next: endIndex < filteredJobs.length,
      page
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

// Save job for a user
export const saveJob = async (userId, jobId) => {
  try {
    // Check if already saved
    const savedJobsSnapshot = await getDocs(
      query(
        collection(db, 'savedJobs'), 
        where('userId', '==', userId),
        where('jobId', '==', jobId)
      )
    );
    
    if (!savedJobsSnapshot.empty) {
      return { id: savedJobsSnapshot.docs[0].id };
    }
    
    // Save job
    const savedJob = {
      userId,
      jobId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'savedJobs'), savedJob);
    return { id: docRef.id };
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
};

// Remove saved job
export const removeSavedJob = async (userId, jobId) => {
  try {
    // Find saved job document
    const savedJobsSnapshot = await getDocs(
      query(
        collection(db, 'savedJobs'), 
        where('userId', '==', userId),
        where('jobId', '==', jobId)
      )
    );
    
    if (savedJobsSnapshot.empty) {
      return false;
    }
    
    // Delete document
    await deleteDoc(doc(db, 'savedJobs', savedJobsSnapshot.docs[0].id));
    return true;
  } catch (error) {
    console.error('Error removing saved job:', error);
    throw error;
  }
};

// Get user's saved jobs
export const getSavedJobs = async (userId, page = 1, pageSize = 10) => {
  try {
    // Get saved job IDs
    const savedJobsSnapshot = await getDocs(
      query(
        collection(db, 'savedJobs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );
    
    // Get job details for each saved job
    const savedJobs = await Promise.all(
      savedJobsSnapshot.docs.map(async (savedJobDoc) => {
        const savedJobData = savedJobDoc.data();
        const jobDoc = await getDoc(doc(db, 'jobs', savedJobData.jobId));
        
        if (!jobDoc.exists()) {
          return null;
        }
        
        const jobData = jobDoc.data();
        
        return {
          id: savedJobDoc.id,
          job_id: savedJobData.jobId,
          created_at: savedJobData.createdAt?.toDate(),
          job: {
            id: savedJobData.jobId,
            title: jobData.title,
            company_name: jobData.company,
            location: jobData.location,
            is_remote: jobData.isRemote || false,
            job_type: jobData.type,
            salary_min: jobData.salary?.min,
            salary_max: jobData.salary?.max,
            currency: jobData.salary?.currency || 'USD',
            created_at: jobData.createdAt?.toDate()
          }
        };
      })
    );
    
    // Filter out null values (jobs that no longer exist)
    const validSavedJobs = savedJobs.filter(job => job !== null);
    
    // Manual pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = validSavedJobs.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: validSavedJobs.length,
      has_next: endIndex < validSavedJobs.length,
      page
    };
  } catch (error) {
    console.error('Error getting saved jobs:', error);
    throw error;
  }
};

// Get employer's job postings
export const getMyJobPostings = async (employerId, page = 1, pageSize = 10) => {
  try {
    const jobs = await getEmployerJobs(employerId);
    
    // Add application counts for each job
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        // Get application count
        const applicationsSnapshot = await getDocs(
          query(collection(db, 'applications'), where('jobId', '==', job.id))
        );
        
        return {
          ...job,
          applications_count: applicationsSnapshot.size,
          company_name: job.company,
          is_active: job.status === 'active',
          job_type: job.type
        };
      })
    );
    
    // Manual pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = jobsWithApplications.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      total: jobsWithApplications.length,
      has_next: endIndex < jobsWithApplications.length,
      page
    };
  } catch (error) {
    console.error('Error getting employer job postings:', error);
    throw error;
  }
};

// Job service export
export const jobService = {
  createJob,
  updateJob,
  deleteJob,
  getJob,
  getJobs,
  getEmployerJobs,
  applyToJob,
  applyForJob: applyToJob,
  getApplications,
  updateApplicationStatus,
  incrementJobViews,
  getMyApplications,
  searchJobs,
  saveJob,
  removeSavedJob,
  getSavedJobs,
  getMyJobPostings
};