from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import profile as profile_service
from app.model.user import User
from app.schema.profile import (
    ProfileInDB, ProfileCreate, ProfileUpdate,
    ExperienceInDB, ExperienceCreate, ExperienceUpdate,
    EducationInDB, EducationCreate, EducationUpdate,
    SkillInDB, SkillCreate, EndorsementInDB
)

router = APIRouter()


# Profile endpoints
@router.get("/me", response_model=ProfileInDB)
def get_current_user_profile(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get current user's profile."""
    profile = profile_service.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/me", response_model=ProfileInDB, status_code=status.HTTP_201_CREATED)
def create_current_user_profile(
        profile_data: ProfileCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Create current user's profile."""
    return profile_service.create_profile(db, current_user.id, profile_data)


@router.put("/me", response_model=ProfileInDB)
def update_current_user_profile(
        profile_data: ProfileUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update current user's profile."""
    return profile_service.update_profile(db, current_user.id, profile_data)


@router.post("/me/profile-image", response_model=ProfileInDB)
def upload_profile_image(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Upload profile image for current user."""
    return profile_service.upload_profile_image(db, current_user.id, file)


@router.post("/me/cover-image", response_model=ProfileInDB)
def upload_cover_image(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Upload cover image for current user."""
    return profile_service.upload_cover_image(db, current_user.id, file)


@router.get("/users/{user_id}", response_model=ProfileInDB)
def get_user_profile(
        user_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get a user's profile by user ID."""
    profile = profile_service.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/strength")
def get_current_profile_strength(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get profile strength percentage for current user."""
    profile = profile_service.get_profile_by_user_id(db, current_user.id)
    if not profile:
        return {"strength": 0}

    strength = profile_service.get_profile_strength(db, profile.id)
    return {"strength": strength}


# Experience endpoints
@router.post("/me/experiences", response_model=ExperienceInDB, status_code=status.HTTP_201_CREATED)
def create_experience(
        experience_data: ExperienceCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Add a new experience to current user's profile."""
    profile = profile_service.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile_service.create_experience(db, profile.id, experience_data)


@router.put("/me/experiences/{experience_id}", response_model=ExperienceInDB)
def update_experience(
        experience_id: int,
        experience_data: ExperienceUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update an experience in current user's profile."""
    experience = profile_service.get_experience(db, experience_id)
    profile = profile_service.get_profile_by_user_id(db, current_user.id)

    if not profile or experience.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this experience")

    return profile_service.update_experience(db, experience_id, experience_data)


@router.delete("/me/experiences/{experience_id}", status_code=status.HTTP_200_OK)
def delete_experience(
        experience_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete an experience from current user's profile."""
    experience = profile_service.get_experience(db, experience_id)
    profile = profile_service.get_profile_by_user_id(db, current_user.id)

    if not profile or experience.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this experience")

    profile_service.delete_experience(db, experience_id)
    return {"message": "Experience deleted successfully"}


# Education endpoints
@router.post("/me/educations", response_model=EducationInDB, status_code=status.HTTP_201_CREATED)
def create_education(
        education_data: EducationCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Add a new education to current user's profile."""
    profile = profile_service.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile_service.create_education(db, profile.id, education_data)


@router.put("/me/educations/{education_id}", response_model=EducationInDB)
def update_education(
        education_id: int,
        education_data: EducationUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update an education in current user's profile."""
    education = profile_service.get_education(db, education_id)
    profile = profile_service.get_profile_by_user_id(db, current_user.id)

    if not profile or education.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this education")

    return profile_service.update_education(db, education_id, education_data)


@router.delete("/me/educations/{education_id}", status_code=status.HTTP_200_OK)
def delete_education(
        education_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete an education from current user's profile."""
    education = profile_service.get_education(db, education_id)
    profile = profile_service.get_profile_by_user_id(db, current_user.id)

    if not profile or education.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this education")

    profile_service.delete_education(db, education_id)
    return {"message": "Education deleted successfully"}


# Skill endpoints
@router.post("/me/skills", response_model=SkillInDB, status_code=status.HTTP_201_CREATED)
def create_skill(
        skill_data: SkillCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Add a new skill to current user's profile."""
    profile = profile_service.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile_service.create_skill(db, profile.id, skill_data)


@router.delete("/me/skills/{skill_id}", status_code=status.HTTP_200_OK)
def delete_skill(
        skill_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a skill from current user's profile."""
    skill = profile_service.get_skill(db, skill_id)
    profile = profile_service.get_profile_by_user_id(db, current_user.id)

    if not profile or skill.profile_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this skill")

    profile_service.delete_skill(db, skill_id)
    return {"message": "Skill deleted successfully"}


@router.post("/skills/{skill_id}/endorse", response_model=EndorsementInDB, status_code=status.HTTP_201_CREATED)
def endorse_skill(
        skill_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Endorse a skill."""
    return profile_service.endorse_skill(db, skill_id, current_user.id)


@router.delete("/skills/{skill_id}/endorse", status_code=status.HTTP_200_OK)
def remove_endorsement(
        skill_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Remove an endorsement from a skill."""
    profile_service.remove_endorsement(db, skill_id, current_user.id)
    return {"message": "Endorsement removed successfully"}