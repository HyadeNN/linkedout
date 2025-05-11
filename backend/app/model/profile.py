from datetime import datetime
from typing import Optional, Dict, Any

class Profile:
    """Profile model for Firestore."""
    def __init__(
        self,
        user_id: str,
        headline: Optional[str] = None,
        about: Optional[str] = None,
        location: Optional[str] = None,
        profile_image: Optional[str] = None,
        cover_image: Optional[str] = None,
        phone_number: Optional[str] = None,
        website: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        profile_id: Optional[str] = None
    ):
        self.profile_id = profile_id
        self.user_id = user_id
        self.headline = headline
        self.about = about
        self.location = location
        self.profile_image = profile_image
        self.cover_image = cover_image
        self.phone_number = phone_number
        self.website = website
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "headline": self.headline,
            "about": self.about,
            "location": self.location,
            "profile_image": self.profile_image,
            "cover_image": self.cover_image,
            "phone_number": self.phone_number,
            "website": self.website,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], profile_id: Optional[str] = None) -> 'Profile':
        return cls(
            user_id=data["user_id"],
            headline=data.get("headline"),
            about=data.get("about"),
            location=data.get("location"),
            profile_image=data.get("profile_image"),
            cover_image=data.get("cover_image"),
            phone_number=data.get("phone_number"),
            website=data.get("website"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            profile_id=profile_id
        )

class Education:
    """Education model for Firestore."""
    def __init__(
        self,
        profile_id: str,
        school: str,
        degree: Optional[str] = None,
        field_of_study: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_current: bool = False,
        description: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        education_id: Optional[str] = None
    ):
        self.education_id = education_id
        self.profile_id = profile_id
        self.school = school
        self.degree = degree
        self.field_of_study = field_of_study
        self.start_date = start_date
        self.end_date = end_date
        self.is_current = is_current
        self.description = description
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "profile_id": self.profile_id,
            "school": self.school,
            "degree": self.degree,
            "field_of_study": self.field_of_study,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "is_current": self.is_current,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], education_id: Optional[str] = None) -> 'Education':
        return cls(
            profile_id=data["profile_id"],
            school=data["school"],
            degree=data.get("degree"),
            field_of_study=data.get("field_of_study"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            is_current=data.get("is_current", False),
            description=data.get("description"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            education_id=education_id
        )

class Skill:
    """Skill model for Firestore."""
    def __init__(
        self,
        profile_id: str,
        name: str,
        created_at: Optional[datetime] = None,
        skill_id: Optional[str] = None
    ):
        self.skill_id = skill_id
        self.profile_id = profile_id
        self.name = name
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "profile_id": self.profile_id,
            "name": self.name,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], skill_id: Optional[str] = None) -> 'Skill':
        return cls(
            profile_id=data["profile_id"],
            name=data["name"],
            created_at=data.get("created_at"),
            skill_id=skill_id
        )