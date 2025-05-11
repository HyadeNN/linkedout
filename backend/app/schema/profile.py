from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class ProfileBase(BaseModel):
    headline: Optional[str] = None
    about: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ExperienceBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: Optional[bool] = False
    description: Optional[str] = None

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(ExperienceBase):
    title: Optional[str] = None
    company: Optional[str] = None

class ExperienceInDB(ExperienceBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class EducationBase(BaseModel):
    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: Optional[bool] = False
    description: Optional[str] = None

class EducationCreate(EducationBase):
    pass

class EducationUpdate(EducationBase):
    school: Optional[str] = None

class EducationInDB(EducationBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class SkillInDB(SkillBase):
    id: int
    profile_id: int
    created_at: datetime
    endorsement_count: Optional[int] = 0

    class Config:
        orm_mode = True

class EndorsementCreate(BaseModel):
    skill_id: int

class EndorsementInDB(BaseModel):
    id: int
    skill_id: int
    endorser_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ProfileInDB(ProfileBase):
    id: int
    user_id: int
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    experiences: List[ExperienceInDB] = []
    educations: List[EducationInDB] = []
    skills: List[SkillInDB] = []

    class Config:
        orm_mode = True