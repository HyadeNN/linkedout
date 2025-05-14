from datetime import datetime
from typing import Optional, Dict, Any

class Job:
    """Job model for Firestore."""
    def __init__(
        self,
        title: str,
        company_name: str,
        location: str,
        job_type: str,
        description: str,
        requirements: Optional[str] = None,
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
        currency: Optional[str] = None,
        is_remote: bool = False,
        poster_id: Optional[str] = None,
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        job_id: Optional[str] = None
    ):
        self.job_id = job_id
        self.title = title
        self.company_name = company_name
        self.location = location
        self.job_type = job_type
        self.description = description
        self.requirements = requirements
        self.salary_min = salary_min
        self.salary_max = salary_max
        self.currency = currency
        self.is_remote = is_remote
        self.poster_id = poster_id
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "company_name": self.company_name,
            "location": self.location,
            "job_type": self.job_type,
            "description": self.description,
            "requirements": self.requirements,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "currency": self.currency,
            "is_remote": self.is_remote,
            "poster_id": self.poster_id,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], job_id: Optional[str] = None) -> 'Job':
        return cls(
            title=data["title"],
            company_name=data["company_name"],
            location=data["location"],
            job_type=data["job_type"],
            description=data["description"],
            requirements=data.get("requirements"),
            salary_min=data.get("salary_min"),
            salary_max=data.get("salary_max"),
            currency=data.get("currency"),
            is_remote=data.get("is_remote", False),
            poster_id=data.get("poster_id"),
            is_active=data.get("is_active", True),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            job_id=job_id
        )

class SavedJob:
    """SavedJob model for Firestore."""
    def __init__(
        self,
        job_id: str,
        user_id: str,
        created_at: Optional[datetime] = None,
        saved_job_id: Optional[str] = None
    ):
        self.saved_job_id = saved_job_id
        self.job_id = job_id
        self.user_id = user_id
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "user_id": self.user_id,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], saved_job_id: Optional[str] = None) -> 'SavedJob':
        return cls(
            job_id=data["job_id"],
            user_id=data["user_id"],
            created_at=data.get("created_at"),
            saved_job_id=saved_job_id
        )

class JobApplication:
    """JobApplication model for Firestore."""
    def __init__(
        self,
        job_id: str,
        applicant_id: str,
        cover_letter: Optional[str] = None,
        status: str = "pending",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        application_id: Optional[str] = None
    ):
        self.application_id = application_id
        self.job_id = job_id
        self.applicant_id = applicant_id
        self.cover_letter = cover_letter
        self.status = status  # pending, accepted, rejected, interviewing
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "applicant_id": self.applicant_id,
            "cover_letter": self.cover_letter,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], application_id: Optional[str] = None) -> 'JobApplication':
        return cls(
            job_id=data["job_id"],
            applicant_id=data["applicant_id"],
            cover_letter=data.get("cover_letter"),
            status=data.get("status", "pending"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            application_id=application_id
        )