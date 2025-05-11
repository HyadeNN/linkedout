from typing import List, Optional
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.model.profile import Profile, Experience, Education, Skill, Endorsement
from app.model.user import User
from app.schema.profile import (
    ProfileCreate, ProfileUpdate,
    ExperienceCreate, ExperienceUpdate,
    EducationCreate, EducationUpdate,
    SkillCreate
)
from app.utils.helpers import save_image_with_resize, delete_file


def get_profile(db: Session, profile_id: int) -> Profile:
    """Get a profile by ID."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def get_profile_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
    """Get a profile by user ID."""
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def create_profile(db: Session, user_id: int, profile_data: ProfileCreate) -> Profile:
    """Create a new profile for a user."""
    # Check if profile already exists
    existing_profile = get_profile_by_user_id(db, user_id)
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists for this user")

    # Create new profile
    db_profile = Profile(
        user_id=user_id,
        **profile_data.dict()
    )

    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)

    return db_profile


def update_profile(db: Session, user_id: int, profile_data: ProfileUpdate) -> Profile:
    """Update a user's profile."""
    db_profile = get_profile_by_user_id(db, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update profile fields
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(db_profile, field, value)

    db.commit()
    db.refresh(db_profile)
    return db_profile


def upload_profile_image(db: Session, user_id: int, file: UploadFile) -> Profile:
    """Upload and update a user's profile image."""
    db_profile = get_profile_by_user_id(db, user_id)
    if not db_profile:
        # Create profile if it doesn't exist
        db_profile = Profile(user_id=user_id)
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)

    # Delete old image if exists
    if db_profile.profile_image:
        delete_file(db_profile.profile_image)

    # Save new image
    image_path = save_image_with_resize(
        file,
        folder="profile_images",
        max_width=400,
        max_height=400
    )

    # Update profile
    db_profile.profile_image = image_path
    db.commit()
    db.refresh(db_profile)

    return db_profile


def upload_cover_image(db: Session, user_id: int, file: UploadFile) -> Profile:
    """Upload and update a user's cover image."""
    db_profile = get_profile_by_user_id(db, user_id)
    if not db_profile:
        # Create profile if it doesn't exist
        db_profile = Profile(user_id=user_id)
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)

    # Delete old image if exists
    if db_profile.cover_image:
        delete_file(db_profile.cover_image)

    # Save new image
    image_path = save_image_with_resize(
        file,
        folder="cover_images",
        max_width=1200,
        max_height=300
    )

    # Update profile
    db_profile.cover_image = image_path
    db.commit()
    db.refresh(db_profile)

    return db_profile


# Experience functions
def get_experience(db: Session, experience_id: int) -> Experience:
    """Get an experience by ID."""
    experience = db.query(Experience).filter(Experience.id == experience_id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    return experience


def create_experience(db: Session, profile_id: int, experience_data: ExperienceCreate) -> Experience:
    """Create a new experience for a profile."""
    db_experience = Experience(
        profile_id=profile_id,
        **experience_data.dict()
    )

    db.add(db_experience)
    db.commit()
    db.refresh(db_experience)

    return db_experience


def update_experience(db: Session, experience_id: int, experience_data: ExperienceUpdate) -> Experience:
    """Update an experience."""
    db_experience = get_experience(db, experience_id)

    # Update experience fields
    for field, value in experience_data.dict(exclude_unset=True).items():
        setattr(db_experience, field, value)

    db.commit()
    db.refresh(db_experience)
    return db_experience


def delete_experience(db: Session, experience_id: int) -> bool:
    """Delete an experience."""
    db_experience = get_experience(db, experience_id)

    db.delete(db_experience)
    db.commit()

    return True


# Education functions
def get_education(db: Session, education_id: int) -> Education:
    """Get an education by ID."""
    education = db.query(Education).filter(Education.id == education_id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")
    return education


def create_education(db: Session, profile_id: int, education_data: EducationCreate) -> Education:
    """Create a new education for a profile."""
    db_education = Education(
        profile_id=profile_id,
        **education_data.dict()
    )

    db.add(db_education)
    db.commit()
    db.refresh(db_education)

    return db_education


def update_education(db: Session, education_id: int, education_data: EducationUpdate) -> Education:
    """Update an education."""
    db_education = get_education(db, education_id)

    # Update education fields
    for field, value in education_data.dict(exclude_unset=True).items():
        setattr(db_education, field, value)

    db.commit()
    db.refresh(db_education)
    return db_education


def delete_education(db: Session, education_id: int) -> bool:
    """Delete an education."""
    db_education = get_education(db, education_id)

    db.delete(db_education)
    db.commit()

    return True


# Skill functions
def get_skill(db: Session, skill_id: int) -> Skill:
    """Get a skill by ID."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


def create_skill(db: Session, profile_id: int, skill_data: SkillCreate) -> Skill:
    """Create a new skill for a profile."""
    # Check if skill already exists for this profile
    existing_skill = db.query(Skill).filter(
        Skill.profile_id == profile_id,
        func.lower(Skill.name) == func.lower(skill_data.name)
    ).first()

    if existing_skill:
        raise HTTPException(status_code=400, detail="Skill already exists for this profile")

    db_skill = Skill(
        profile_id=profile_id,
        name=skill_data.name
    )

    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)

    return db_skill


def delete_skill(db: Session, skill_id: int) -> bool:
    """Delete a skill."""
    db_skill = get_skill(db, skill_id)

    db.delete(db_skill)
    db.commit()

    return True


def endorse_skill(db: Session, skill_id: int, endorser_id: int) -> Endorsement:
    """Endorse a skill."""
    # Check if skill exists
    db_skill = get_skill(db, skill_id)

    # Check if endorsement already exists
    existing_endorsement = db.query(Endorsement).filter(
        Endorsement.skill_id == skill_id,
        Endorsement.endorser_id == endorser_id
    ).first()

    if existing_endorsement:
        raise HTTPException(status_code=400, detail="Skill already endorsed by this user")

    # Get skill owner (profile) to check if user is not endorsing their own skill
    if db_skill.profile.user_id == endorser_id:
        raise HTTPException(status_code=400, detail="Cannot endorse your own skill")

    # Create endorsement
    db_endorsement = Endorsement(
        skill_id=skill_id,
        endorser_id=endorser_id
    )

    db.add(db_endorsement)
    db.commit()
    db.refresh(db_endorsement)

    return db_endorsement


def remove_endorsement(db: Session, skill_id: int, endorser_id: int) -> bool:
    """Remove an endorsement from a skill."""
    # Check if endorsement exists
    endorsement = db.query(Endorsement).filter(
        Endorsement.skill_id == skill_id,
        Endorsement.endorser_id == endorser_id
    ).first()

    if not endorsement:
        raise HTTPException(status_code=404, detail="Endorsement not found")

    db.delete(endorsement)
    db.commit()

    return True


def get_profile_strength(db: Session, profile_id: int) -> int:
    """Calculate profile strength as a percentage."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    total_points = 0
    max_points = 100

    # Basic profile information (30%)
    if profile.headline:
        total_points += 5
    if profile.about:
        total_points += 10
    if profile.location:
        total_points += 5
    if profile.profile_image:
        total_points += 5
    if profile.cover_image:
        total_points += 5

    # Experience (25%)
    experience_count = db.query(Experience).filter(Experience.profile_id == profile_id).count()
    experience_points = min(experience_count * 5, 25)
    total_points += experience_points

    # Education (20%)
    education_count = db.query(Education).filter(Education.profile_id == profile_id).count()
    education_points = min(education_count * 10, 20)
    total_points += education_points

    # Skills (25%)
    skill_count = db.query(Skill).filter(Skill.profile_id == profile_id).count()
    skill_points = min(skill_count * 2.5, 25)
    total_points += skill_points

    # Calculate percentage
    strength_percentage = int(total_points)
    return min(strength_percentage, 100)  # Cap at 100%