from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schema.user import UserResponse

class JobBase(BaseModel):
    title: str
    company_name: str
    location: str
    job_type: str
    description: str
    requirements: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    is_remote: Optional[bool] = False

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    is_remote: Optional[bool] = None
    is_active: Optional[bool] = None

class JobApplicationBase(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    pass

class JobApplicationUpdate(BaseModel):
    status: str

class SavedJobBase(BaseModel):
    job_id: str

class SavedJobCreate(SavedJobBase):
    pass

class JobApplicationInDB(JobApplicationBase):
    application_id: str
    applicant_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class JobApplicationWithUser(JobApplicationInDB):
    applicant: Optional[UserResponse] = None

class SavedJobInDB(SavedJobBase):
    saved_job_id: str
    user_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class JobInDB(JobBase):
    job_id: str
    poster_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class JobWithUser(JobInDB):
    poster: Optional[UserResponse] = None
    applications: List[JobApplicationWithUser] = []
    applications_count: Optional[int] = 0