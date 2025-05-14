from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import job as job_service
from app.model.user import User
from app.schema.job import (
    JobInDB, JobCreate, JobUpdate, JobWithUser,
    JobApplicationInDB, JobApplicationCreate, JobApplicationUpdate, JobApplicationWithUser,
    SavedJobInDB, SavedJobCreate
)
from app.utils.helpers import paginate_response

router = APIRouter()


# Job posting endpoints
@router.post("/", response_model=JobInDB, status_code=status.HTTP_201_CREATED)
def create_job(
        job_data: JobCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Create a new job posting."""
    return job_service.create_job(db, current_user.id, job_data)


@router.put("/{job_id}", response_model=JobInDB)
def update_job(
        job_id: str,
        job_data: JobUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update a job posting."""
    return job_service.update_job(db, job_id, current_user.id, job_data)


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
        job_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a job posting."""
    job_service.delete_job(db, job_id, current_user.id)
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}", response_model=JobWithUser)
def get_job(
        job_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get a job posting by ID."""
    job = job_service.get_job(db, job_id)

    # Add applications count
    job.applications_count = job_service.count_job_applications(db, job_id,
                                                                current_user.id) if job.poster_id == current_user.id else 0

    # Check if current user has saved this job
    job.is_saved = job_service.is_job_saved(db, current_user.id, job_id)

    # Check if current user has applied to this job
    job.is_applied = job_service.is_job_applied(db, current_user.id, job_id)

    return job


@router.get("/", response_model=Dict)
def get_jobs(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all active job postings."""
    skip = (page - 1) * limit
    jobs = job_service.get_jobs(db, skip, limit)
    total = job_service.count_jobs(db)

    # Add is_saved and is_applied flags
    for job in jobs:
        job.is_saved = job_service.is_job_saved(db, current_user.id, job.job_id)
        job.is_applied = job_service.is_job_applied(db, current_user.id, job.job_id)

    return paginate_response(jobs, page, limit, total)


@router.get("/my-postings", response_model=Dict)
def get_my_job_postings(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all job postings created by current user."""
    skip = (page - 1) * limit
    jobs = job_service.get_user_jobs(db, current_user.id, skip, limit)
    total = job_service.count_user_jobs(db, current_user.id)

    # Add applications count
    for job in jobs:
        job.applications_count = job_service.count_job_applications(db, job.job_id, current_user.id)

    return paginate_response(jobs, page, limit, total)


@router.get("/search", response_model=Dict)
def search_jobs(
        query: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        is_remote: Optional[bool] = None,
        min_salary: Optional[float] = None,
        max_salary: Optional[float] = None,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Search for jobs with various filters."""
    skip = (page - 1) * limit
    jobs = job_service.search_jobs(
        db, query, location, job_type, is_remote, min_salary, max_salary, skip, limit
    )
    total = job_service.count_search_jobs(
        db, query, location, job_type, is_remote, min_salary, max_salary
    )

    # Add is_saved and is_applied flags
    for job in jobs:
        job.is_saved = job_service.is_job_saved(db, current_user.id, job.job_id)
        job.is_applied = job_service.is_job_applied(db, current_user.id, job.job_id)

    return paginate_response(jobs, page, limit, total)


# Job application endpoints
@router.post("/apply", response_model=JobApplicationInDB, status_code=status.HTTP_201_CREATED)
def apply_for_job(
        application_data: JobApplicationCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Apply for a job."""
    return job_service.create_job_application(db, current_user.id, application_data)


@router.put("/applications/{application_id}", response_model=JobApplicationInDB)
def update_application_status(
        application_id: str,
        application_data: JobApplicationUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update a job application status."""
    return job_service.update_job_application_status(db, application_id, current_user.id, application_data)


@router.get("/{job_id}/applications", response_model=Dict)
def get_job_applications(
        job_id: str,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all applications for a job."""
    skip = (page - 1) * limit
    applications = job_service.get_job_applications(db, job_id, current_user.id, skip, limit)
    total = job_service.count_job_applications(db, job_id, current_user.id)

    return paginate_response(applications, page, limit, total)


@router.get("/my-applications", response_model=Dict)
def get_my_applications(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all job applications by current user."""
    skip = (page - 1) * limit
    applications = job_service.get_user_applications(db, current_user.id, skip, limit)
    total = job_service.count_user_applications(db, current_user.id)

    return paginate_response(applications, page, limit, total)


# Saved job endpoints
@router.post("/save", response_model=SavedJobInDB, status_code=status.HTTP_201_CREATED)
def save_job(
        saved_job_data: SavedJobCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Save a job for later."""
    return job_service.save_job(db, current_user.id, saved_job_data)


@router.delete("/save/{job_id}", status_code=status.HTTP_200_OK)
def remove_saved_job(
        job_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Remove a saved job."""
    job_service.remove_saved_job(db, current_user.id, job_id)
    return {"message": "Job removed from saved jobs"}


@router.get("/saved", response_model=Dict)
def get_saved_jobs(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all saved jobs for current user."""
    skip = (page - 1) * limit
    saved_jobs = job_service.get_saved_jobs(db, current_user.id, skip, limit)
    total = job_service.count_saved_jobs(db, current_user.id)

    return paginate_response(saved_jobs, page, limit, total)


@router.get("/{job_id}/is-saved")
def is_job_saved(
        job_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Check if current user has saved a job."""
    is_saved = job_service.is_job_saved(db, current_user.id, job_id)
    return {"is_saved": is_saved}


@router.get("/{job_id}/is-applied")
def is_job_applied(
        job_id: str,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Check if current user has applied for a job."""
    is_applied = job_service.is_job_applied(db, current_user.id, job_id)
    return {"is_applied": is_applied}