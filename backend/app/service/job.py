from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_, func
from firebase_admin import firestore

from app.model.job import Job, JobApplication, SavedJob
from app.model.user import User
from app.model.notification import Notification
from app.schema.job import JobCreate, JobUpdate, JobApplicationCreate, JobApplicationUpdate, SavedJobCreate


def get_job(db: firestore.Client, job_id: str) -> Optional[Job]:
    """Get a job by ID."""
    jobs_ref = db.collection('jobs')
    doc = jobs_ref.document(job_id).get()
    
    if not doc.exists:
        return None
    
    return Job.from_dict(doc.to_dict())


def create_job(db: firestore.Client, job: Job) -> Job:
    """Create a new job."""
    jobs_ref = db.collection('jobs')
    doc_ref = jobs_ref.add(job.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return Job.from_dict(doc.to_dict())


def update_job(db: firestore.Client, job_id: str, job_data: dict) -> Optional[Job]:
    """Update a job."""
    jobs_ref = db.collection('jobs')
    doc_ref = jobs_ref.document(job_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    # Update the job
    doc_ref.update(job_data)
    
    # Get the updated document
    doc = doc_ref.get()
    return Job.from_dict(doc.to_dict())


def delete_job(db: firestore.Client, job_id: str) -> bool:
    """Delete a job."""
    jobs_ref = db.collection('jobs')
    doc_ref = jobs_ref.document(job_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return False
    
    # Delete the job
    doc_ref.delete()
    return True


def get_jobs(
    db: firestore.Client,
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[str] = None,
    search_query: Optional[str] = None
) -> List[Job]:
    """Get all jobs with optional filtering."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply filters
    if company_id:
        query = query.where('company_id', '==', company_id)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    jobs = [Job.from_dict(doc.to_dict()) for doc in docs]
    
    # Apply search filter if provided
    if search_query:
        search_query = search_query.lower()
        jobs = [
            job for job in jobs
            if search_query in job.title.lower() or
               search_query in job.description.lower() or
               search_query in job.location.lower()
        ]
    
    return jobs


def count_jobs(db: firestore.Client, company_id: Optional[str] = None) -> int:
    """Get total number of jobs."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref
    
    if company_id:
        query = query.where('company_id', '==', company_id)
    
    return len(query.get())


def get_user_jobs(db: firestore.Client, user_id: str, skip: int = 0, limit: int = 100) -> List[Job]:
    """Get all job postings by a specific user."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref.where('poster_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    jobs = [Job.from_dict(doc.to_dict()) for doc in docs]
    
    return jobs


def count_user_jobs(db: firestore.Client, user_id: str) -> int:
    """Count the total number of job postings by a specific user."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref.where('poster_id', '==', user_id)
    
    return len(query.get())


def search_jobs(db: firestore.Client, query: Optional[str] = None, location: Optional[str] = None,
                job_type: Optional[str] = None, is_remote: Optional[bool] = None,
                min_salary: Optional[float] = None, max_salary: Optional[float] = None,
                skip: int = 0, limit: int = 100) -> List[Job]:
    """Search for jobs with various filters."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply filters
    if query:
        search_term = f"%{query}%"
        query = query.where('title', '>=', search_term).where('title', '<=', search_term)
    
    if location:
        search_location = f"%{location}%"
        query = query.where('location', '>=', search_location).where('location', '<=', search_location)
    
    if job_type:
        query = query.where('job_type', '==', job_type)
    
    if is_remote is not None:
        query = query.where('is_remote', '==', is_remote)
    
    if min_salary is not None:
        query = query.where('salary_max', '>=', min_salary)
    
    if max_salary is not None:
        query = query.where('salary_min', '<=', max_salary)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    jobs = [Job.from_dict(doc.to_dict()) for doc in docs]
    
    # Apply search filter if provided
    if query:
        search_query = query.to_dict()['title'].lower()
        jobs = [
            job for job in jobs
            if search_query in job.title.lower() or
               search_query in job.description.lower() or
               search_query in job.location.lower()
        ]
    
    return jobs


def count_search_jobs(db: firestore.Client, query: Optional[str] = None, location: Optional[str] = None,
                      job_type: Optional[str] = None, is_remote: Optional[bool] = None,
                      min_salary: Optional[float] = None, max_salary: Optional[float] = None) -> int:
    """Count the number of jobs matching the search criteria."""
    jobs_ref = db.collection('jobs')
    query = jobs_ref
    
    # Apply filters
    if query:
        search_term = f"%{query}%"
        query = query.where('title', '>=', search_term).where('title', '<=', search_term)
    
    if location:
        search_location = f"%{location}%"
        query = query.where('location', '>=', search_location).where('location', '<=', search_location)
    
    if job_type:
        query = query.where('job_type', '==', job_type)
    
    if is_remote is not None:
        query = query.where('is_remote', '==', is_remote)
    
    if min_salary is not None:
        query = query.where('salary_max', '>=', min_salary)
    
    if max_salary is not None:
        query = query.where('salary_min', '<=', max_salary)
    
    return len(query.get())


# Job application functions
def get_job_application(db: firestore.Client, application_id: str) -> Optional[JobApplication]:
    """Get a job application by ID."""
    application_ref = db.collection('job_applications').document(application_id)
    doc = application_ref.get()
    
    if not doc.exists:
        return None
    
    return JobApplication.from_dict(doc.to_dict())


def create_job_application(db: firestore.Client, applicant_id: str, application_data: JobApplicationCreate) -> JobApplication:
    """Create a new job application."""
    # Check if job exists and is active
    job = get_job(db, application_data.job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    # Check if user has already applied
    existing_application = get_job_application(db, application_data.id)

    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Create application
    db_application = JobApplication(
        job_id=application_data.job_id,
        applicant_id=applicant_id,
        cover_letter=application_data.cover_letter,
        status="pending"
    )

    # Add application to Firestore
    application_ref = db.collection('job_applications').document(application_data.id)
    application_ref.set(db_application.to_dict())

    # Create notification for job poster
    applicant = get_user(db, applicant_id)

    notification = Notification(
        user_id=job.poster_id,
        type="job_application",
        message=f"{applicant.first_name} {applicant.last_name} applied for your job posting: {job.title}",
        source_id=application_data.id,
        source_type="job_application",
        created_by=applicant_id
    )

    # Add notification to Firestore
    notification_ref = db.collection('notifications').document(notification.id)
    notification_ref.set(notification.to_dict())

    return db_application


def update_job_application_status(db: firestore.Client, application_id: str, user_id: str,
                                  application_data: JobApplicationUpdate) -> JobApplication:
    """Update a job application status."""
    application_ref = db.collection('job_applications').document(application_id)
    doc = application_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    db_application = JobApplication.from_dict(doc.to_dict())

    # Check if user is the job poster
    job = get_job(db, db_application.job_id)
    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")

    # Update status
    db_application.status = application_data.status
    application_ref.update(db_application.to_dict())

    # Create notification for applicant
    employer = get_user(db, user_id)

    notification_message = f"Your application for {job.title} has been {application_data.status}"

    notification = Notification(
        user_id=db_application.applicant_id,
        type="application_status",
        message=notification_message,
        source_id=application_id,
        source_type="job_application",
        created_by=user_id
    )

    # Add notification to Firestore
    notification_ref = db.collection('notifications').document(notification.id)
    notification_ref.set(notification.to_dict())

    return db_application


def get_job_applications(db: firestore.Client, job_id: str, user_id: str, skip: int = 0, limit: int = 50) -> List[
    JobApplication]:
    """Get all applications for a job."""
    applications_ref = db.collection('job_applications')
    query = applications_ref.where('job_id', '==', job_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    applications = [JobApplication.from_dict(doc.to_dict()) for doc in docs]
    
    # Check if user is the job poster
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    return applications


def count_job_applications(db: firestore.Client, job_id: str, user_id: str) -> int:
    """Count the total number of applications for a job."""
    applications_ref = db.collection('job_applications')
    query = applications_ref.where('job_id', '==', job_id)
    
    # Check if user is the job poster
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    return len(query.get())


def get_user_applications(db: firestore.Client, user_id: str, skip: int = 0, limit: int = 50) -> List[JobApplication]:
    """Get all job applications by a specific user."""
    applications_ref = db.collection('job_applications')
    query = applications_ref.where('applicant_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    applications = [JobApplication.from_dict(doc.to_dict()) for doc in docs]
    
    return applications


def count_user_applications(db: firestore.Client, user_id: str) -> int:
    """Count the total number of job applications by a specific user."""
    applications_ref = db.collection('job_applications')
    query = applications_ref.where('applicant_id', '==', user_id)
    
    return len(query.get())


# Saved job functions
def save_job(db: firestore.Client, user_id: str, job_id: str) -> Optional[SavedJob]:
    """Save a job for a user."""
    # Check if job exists
    job = get_job(db, job_id)
    if not job:
        return None
    
    # Check if already saved
    saved_jobs_ref = db.collection('saved_jobs')
    query = saved_jobs_ref.where('user_id', '==', user_id).where('job_id', '==', job_id)
    docs = query.get()
    
    if docs:
        return SavedJob.from_dict(docs[0].to_dict())
    
    # Create new saved job
    saved_job = SavedJob(user_id=user_id, job_id=job_id)
    doc_ref = saved_jobs_ref.add(saved_job.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return SavedJob.from_dict(doc.to_dict())


def unsave_job(db: firestore.Client, user_id: str, job_id: str) -> bool:
    """Unsave a job for a user."""
    saved_jobs_ref = db.collection('saved_jobs')
    query = saved_jobs_ref.where('user_id', '==', user_id).where('job_id', '==', job_id)
    docs = query.get()
    
    if not docs:
        return False
    
    # Delete the saved job
    docs[0].reference.delete()
    return True


def get_saved_jobs(db: firestore.Client, user_id: str, skip: int = 0, limit: int = 100) -> List[Job]:
    """Get all saved jobs for a user."""
    saved_jobs_ref = db.collection('saved_jobs')
    query = saved_jobs_ref.where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    saved_jobs = [SavedJob.from_dict(doc.to_dict()) for doc in docs]
    
    # Get the actual jobs
    jobs = []
    for saved_job in saved_jobs:
        job = get_job(db, saved_job.job_id)
        if job:
            jobs.append(job)
    
    return jobs


def count_saved_jobs(db: firestore.Client, user_id: str) -> int:
    """Count the total number of saved jobs for a user."""
    saved_jobs_ref = db.collection('saved_jobs')
    query = saved_jobs_ref.where('user_id', '==', user_id)
    
    return len(query.get())


def is_job_saved(db: firestore.Client, user_id: str, job_id: str) -> bool:
    """Check if a job is saved by a user."""
    saved_jobs_ref = db.collection('saved_jobs')
    query = saved_jobs_ref.where('user_id', '==', user_id).where('job_id', '==', job_id)
    docs = query.get()
    
    return docs.exists


def is_job_applied(db: firestore.Client, user_id: str, job_id: str) -> bool:
    """Check if a user has applied for a job."""
    applications_ref = db.collection('job_applications')
    query = applications_ref.where('job_id', '==', job_id).where('applicant_id', '==', user_id)
    docs = query.get()
    
    return docs.exists