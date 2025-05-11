from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_, func

from app.model.job import Job, JobApplication, SavedJob
from app.model.user import User
from app.model.notification import Notification
from app.schema.job import JobCreate, JobUpdate, JobApplicationCreate, JobApplicationUpdate, SavedJobCreate


def get_job(db: Session, job_id: int) -> Job:
    """Get a job by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def create_job(db: Session, poster_id: int, job_data: JobCreate) -> Job:
    """Create a new job posting."""
    # Check if user has employer role
    user = db.query(User).filter(User.id == poster_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != "employer" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only employers can post jobs")

    # Create job
    db_job = Job(
        poster_id=poster_id,
        **job_data.dict()
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return db_job


def update_job(db: Session, job_id: int, user_id: int, job_data: JobUpdate) -> Job:
    """Update a job posting."""
    db_job = get_job(db, job_id)

    # Check if user is the poster
    if db_job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")

    # Update job fields
    for field, value in job_data.dict(exclude_unset=True).items():
        setattr(db_job, field, value)

    db.commit()
    db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int, user_id: int) -> bool:
    """Delete a job posting."""
    db_job = get_job(db, job_id)

    # Check if user is the poster or an admin
    user = db.query(User).filter(User.id == user_id).first()
    if db_job.poster_id != user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")

    db.delete(db_job)
    db.commit()

    return True


def get_jobs(db: Session, skip: int = 0, limit: int = 20) -> List[Job]:
    """Get all active job postings."""
    return db.query(Job).filter(Job.is_active == True).order_by(desc(Job.created_at)).offset(skip).limit(limit).all()


def count_jobs(db: Session) -> int:
    """Count the total number of active job postings."""
    return db.query(Job).filter(Job.is_active == True).count()


def get_user_jobs(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Job]:
    """Get all job postings by a specific user."""
    return db.query(Job).filter(Job.poster_id == user_id).order_by(desc(Job.created_at)).offset(skip).limit(limit).all()


def count_user_jobs(db: Session, user_id: int) -> int:
    """Count the total number of job postings by a specific user."""
    return db.query(Job).filter(Job.poster_id == user_id).count()


def search_jobs(db: Session, query: Optional[str] = None, location: Optional[str] = None,
                job_type: Optional[str] = None, is_remote: Optional[bool] = None,
                min_salary: Optional[float] = None, max_salary: Optional[float] = None,
                skip: int = 0, limit: int = 20) -> List[Job]:
    """Search for jobs with various filters."""
    # Base query: only active jobs
    jobs_query = db.query(Job).filter(Job.is_active == True)

    # Apply filters
    if query:
        search_term = f"%{query}%"
        jobs_query = jobs_query.filter(
            or_(
                Job.title.ilike(search_term),
                Job.company_name.ilike(search_term),
                Job.description.ilike(search_term),
                Job.requirements.ilike(search_term)
            )
        )

    if location:
        search_location = f"%{location}%"
        jobs_query = jobs_query.filter(Job.location.ilike(search_location))

    if job_type:
        jobs_query = jobs_query.filter(Job.job_type == job_type)

    if is_remote is not None:
        jobs_query = jobs_query.filter(Job.is_remote == is_remote)

    if min_salary is not None:
        jobs_query = jobs_query.filter(Job.salary_max >= min_salary)

    if max_salary is not None:
        jobs_query = jobs_query.filter(Job.salary_min <= max_salary)

    # Order by created_at and apply pagination
    return jobs_query.order_by(desc(Job.created_at)).offset(skip).limit(limit).all()


def count_search_jobs(db: Session, query: Optional[str] = None, location: Optional[str] = None,
                      job_type: Optional[str] = None, is_remote: Optional[bool] = None,
                      min_salary: Optional[float] = None, max_salary: Optional[float] = None) -> int:
    """Count the number of jobs matching the search criteria."""
    # Base query: only active jobs
    jobs_query = db.query(Job).filter(Job.is_active == True)

    # Apply filters
    if query:
        search_term = f"%{query}%"
        jobs_query = jobs_query.filter(
            or_(
                Job.title.ilike(search_term),
                Job.company_name.ilike(search_term),
                Job.description.ilike(search_term),
                Job.requirements.ilike(search_term)
            )
        )

    if location:
        search_location = f"%{location}%"
        jobs_query = jobs_query.filter(Job.location.ilike(search_location))

    if job_type:
        jobs_query = jobs_query.filter(Job.job_type == job_type)

    if is_remote is not None:
        jobs_query = jobs_query.filter(Job.is_remote == is_remote)

    if min_salary is not None:
        jobs_query = jobs_query.filter(Job.salary_max >= min_salary)

    if max_salary is not None:
        jobs_query = jobs_query.filter(Job.salary_min <= max_salary)

    return jobs_query.count()


# Job application functions
def get_job_application(db: Session, application_id: int) -> JobApplication:
    """Get a job application by ID."""
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Job application not found")
    return application


def create_job_application(db: Session, applicant_id: int, application_data: JobApplicationCreate) -> JobApplication:
    """Create a new job application."""
    # Check if job exists and is active
    job = db.query(Job).filter(
        (Job.id == application_data.job_id) &
        (Job.is_active == True)
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    # Check if user has already applied
    existing_application = db.query(JobApplication).filter(
        (JobApplication.job_id == application_data.job_id) &
        (JobApplication.applicant_id == applicant_id)
    ).first()

    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Create application
    db_application = JobApplication(
        job_id=application_data.job_id,
        applicant_id=applicant_id,
        cover_letter=application_data.cover_letter,
        status="pending"
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    # Create notification for job poster
    applicant = db.query(User).filter(User.id == applicant_id).first()

    notification = Notification(
        user_id=job.poster_id,
        type="job_application",
        message=f"{applicant.first_name} {applicant.last_name} applied for your job posting: {job.title}",
        source_id=db_application.id,
        source_type="job_application",
        created_by=applicant_id
    )

    db.add(notification)
    db.commit()

    return db_application


def update_job_application_status(db: Session, application_id: int, user_id: int,
                                  application_data: JobApplicationUpdate) -> JobApplication:
    """Update a job application status."""
    db_application = get_job_application(db, application_id)

    # Check if user is the job poster
    job = db.query(Job).filter(Job.id == db_application.job_id).first()
    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")

    # Update status
    db_application.status = application_data.status
    db.commit()
    db.refresh(db_application)

    # Create notification for applicant
    employer = db.query(User).filter(User.id == user_id).first()

    notification_message = f"Your application for {job.title} has been {application_data.status}"

    notification = Notification(
        user_id=db_application.applicant_id,
        type="application_status",
        message=notification_message,
        source_id=db_application.id,
        source_type="job_application",
        created_by=user_id
    )

    db.add(notification)
    db.commit()

    return db_application


def get_job_applications(db: Session, job_id: int, user_id: int, skip: int = 0, limit: int = 50) -> List[
    JobApplication]:
    """Get all applications for a job."""
    # Check if user is the job poster
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    return db.query(JobApplication).filter(JobApplication.job_id == job_id).order_by(
        desc(JobApplication.created_at)
    ).offset(skip).limit(limit).all()


def count_job_applications(db: Session, job_id: int, user_id: int) -> int:
    """Count the total number of applications for a job."""
    # Check if user is the job poster
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.poster_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    return db.query(JobApplication).filter(JobApplication.job_id == job_id).count()


def get_user_applications(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[JobApplication]:
    """Get all job applications by a specific user."""
    return db.query(JobApplication).filter(JobApplication.applicant_id == user_id).order_by(
        desc(JobApplication.created_at)
    ).offset(skip).limit(limit).all()


def count_user_applications(db: Session, user_id: int) -> int:
    """Count the total number of job applications by a specific user."""
    return db.query(JobApplication).filter(JobApplication.applicant_id == user_id).count()


# Saved job functions
def save_job(db: Session, user_id: int, saved_job_data: SavedJobCreate) -> SavedJob:
    """Save a job for a user."""
    # Check if job exists and is active
    job = db.query(Job).filter(
        (Job.id == saved_job_data.job_id) &
        (Job.is_active == True)
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    # Check if already saved
    existing_saved = db.query(SavedJob).filter(
        (SavedJob.job_id == saved_job_data.job_id) &
        (SavedJob.user_id == user_id)
    ).first()

    if existing_saved:
        raise HTTPException(status_code=400, detail="Job already saved")

    # Create saved job
    db_saved_job = SavedJob(
        job_id=saved_job_data.job_id,
        user_id=user_id
    )

    db.add(db_saved_job)
    db.commit()
    db.refresh(db_saved_job)

    return db_saved_job


def remove_saved_job(db: Session, user_id: int, job_id: int) -> bool:
    """Remove a saved job."""
    # Check if saved
    db_saved_job = db.query(SavedJob).filter(
        (SavedJob.job_id == job_id) &
        (SavedJob.user_id == user_id)
    ).first()

    if not db_saved_job:
        raise HTTPException(status_code=404, detail="Job not saved")

    db.delete(db_saved_job)
    db.commit()

    return True


def get_saved_jobs(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[SavedJob]:
    """Get all saved jobs for a user."""
    return db.query(SavedJob).filter(SavedJob.user_id == user_id).order_by(
        desc(SavedJob.created_at)
    ).offset(skip).limit(limit).all()


def count_saved_jobs(db: Session, user_id: int) -> int:
    """Count the total number of saved jobs for a user."""
    return db.query(SavedJob).filter(SavedJob.user_id == user_id).count()


def is_job_saved(db: Session, user_id: int, job_id: int) -> bool:
    """Check if a job is saved by a user."""
    return db.query(SavedJob).filter(
        (SavedJob.job_id == job_id) &
        (SavedJob.user_id == user_id)
    ).first() is not None


def is_job_applied(db: Session, user_id: int, job_id: int) -> bool:
    """Check if a user has applied for a job."""
    return db.query(JobApplication).filter(
        (JobApplication.job_id == job_id) &
        (JobApplication.applicant_id == user_id)
    ).first() is not None