from typing import List, Optional
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from firebase_admin import firestore

from app.model.profile import Profile, Experience, Education, Skill, Endorsement
from app.model.user import User
from app.schema.profile import (
    ProfileCreate, ProfileUpdate,
    ExperienceCreate, ExperienceUpdate,
    EducationCreate, EducationUpdate,
    SkillCreate
)
from app.utils.helpers import save_image_with_resize, delete_file


def get_profile(db: firestore.Client, user_id: str) -> Optional[Profile]:
    """Get a user's profile."""
    profiles_ref = db.collection('profiles')
    query = profiles_ref.where('user_id', '==', user_id)
    docs = query.get()
    
    if not docs:
        return None
    
    return Profile.from_dict(docs[0].to_dict())


def get_profile_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
    """Get a profile by user ID."""
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def create_profile(db: firestore.Client, profile: Profile) -> Profile:
    """Create a new profile."""
    profiles_ref = db.collection('profiles')
    doc_ref = profiles_ref.add(profile.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return Profile.from_dict(doc.to_dict())


def update_profile(db: firestore.Client, user_id: str, profile_data: dict) -> Optional[Profile]:
    """Update a user's profile."""
    profiles_ref = db.collection('profiles')
    query = profiles_ref.where('user_id', '==', user_id)
    docs = query.get()
    
    if not docs:
        return None
    
    # Update the profile
    doc_ref = docs[0].reference
    doc_ref.update(profile_data)
    
    # Get the updated document
    doc = doc_ref.get()
    return Profile.from_dict(doc.to_dict())


def delete_profile(db: firestore.Client, user_id: str) -> bool:
    """Delete a user's profile."""
    profiles_ref = db.collection('profiles')
    query = profiles_ref.where('user_id', '==', user_id)
    docs = query.get()
    
    if not docs:
        return False
    
    # Delete the profile
    docs[0].reference.delete()
    return True


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
def get_education(db: firestore.Client, education_id: str) -> Optional[Education]:
    """Get an education entry by ID."""
    education_ref = db.collection('education')
    doc = education_ref.document(education_id).get()
    
    if not doc.exists:
        return None
    
    return Education.from_dict(doc.to_dict())


def get_educations(db: firestore.Client, user_id: str) -> List[Education]:
    """Get all education entries for a user."""
    education_ref = db.collection('education')
    query = education_ref.where('user_id', '==', user_id).order_by('start_date', direction=firestore.Query.DESCENDING)
    docs = query.get()
    return [Education.from_dict(doc.to_dict()) for doc in docs]


def create_education(db: firestore.Client, education: Education) -> Education:
    """Create a new education entry."""
    education_ref = db.collection('education')
    doc_ref = education_ref.add(education.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return Education.from_dict(doc.to_dict())


def update_education(db: firestore.Client, education_id: str, education_data: dict) -> Optional[Education]:
    """Update an education entry."""
    education_ref = db.collection('education')
    doc_ref = education_ref.document(education_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    # Update the education entry
    doc_ref.update(education_data)
    
    # Get the updated document
    doc = doc_ref.get()
    return Education.from_dict(doc.to_dict())


def delete_education(db: firestore.Client, education_id: str) -> bool:
    """Delete an education entry."""
    education_ref = db.collection('education')
    doc_ref = education_ref.document(education_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return False
    
    # Delete the education entry
    doc_ref.delete()
    return True


# Skill functions
def get_skill(db: firestore.Client, skill_id: str) -> Optional[Skill]:
    """Get a skill by ID."""
    skills_ref = db.collection('skills')
    doc = skills_ref.document(skill_id).get()
    
    if not doc.exists:
        return None
    
    return Skill.from_dict(doc.to_dict())


def get_skills(db: firestore.Client, user_id: str) -> List[Skill]:
    """Get all skills for a user."""
    skills_ref = db.collection('skills')
    query = skills_ref.where('user_id', '==', user_id)
    docs = query.get()
    return [Skill.from_dict(doc.to_dict()) for doc in docs]


def create_skill(db: firestore.Client, skill: Skill) -> Skill:
    """Create a new skill."""
    skills_ref = db.collection('skills')
    doc_ref = skills_ref.add(skill.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return Skill.from_dict(doc.to_dict())


def update_skill(db: firestore.Client, skill_id: str, skill_data: dict) -> Optional[Skill]:
    """Update a skill."""
    skills_ref = db.collection('skills')
    doc_ref = skills_ref.document(skill_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    # Update the skill
    doc_ref.update(skill_data)
    
    # Get the updated document
    doc = doc_ref.get()
    return Skill.from_dict(doc.to_dict())


def delete_skill(db: firestore.Client, skill_id: str) -> bool:
    """Delete a skill."""
    skills_ref = db.collection('skills')
    doc_ref = skills_ref.document(skill_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return False
    
    # Delete the skill
    doc_ref.delete()
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


def search_profiles(
    db: firestore.Client,
    query: Optional[str] = None,
    skills: Optional[List[str]] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Profile]:
    """Search for profiles with various filters."""
    profiles_ref = db.collection('profiles')
    query = profiles_ref
    
    # Apply filters
    if location:
        query = query.where('location', '==', location)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    profiles = [Profile.from_dict(doc.to_dict()) for doc in docs]
    
    # Apply search filter if provided
    if query:
        search_query = query.lower()
        profiles = [
            profile for profile in profiles
            if search_query in profile.headline.lower() or
               search_query in profile.summary.lower() or
               search_query in profile.current_position.lower()
        ]
    
    # Apply skills filter if provided
    if skills:
        profiles = [
            profile for profile in profiles
            if any(skill.lower() in [s.name.lower() for s in profile.skills] for skill in skills)
        ]
    
    return profiles


def count_search_profiles(
    db: firestore.Client,
    query: Optional[str] = None,
    skills: Optional[List[str]] = None,
    location: Optional[str] = None
) -> int:
    """Count the number of profiles matching the search criteria."""
    profiles_ref = db.collection('profiles')
    query = profiles_ref
    
    # Apply filters
    if location:
        query = query.where('location', '==', location)
    
    docs = query.get()
    profiles = [Profile.from_dict(doc.to_dict()) for doc in docs]
    
    # Apply search filter if provided
    if query:
        search_query = query.lower()
        profiles = [
            profile for profile in profiles
            if search_query in profile.headline.lower() or
               search_query in profile.summary.lower() or
               search_query in profile.current_position.lower()
        ]
    
    # Apply skills filter if provided
    if skills:
        profiles = [
            profile for profile in profiles
            if any(skill.lower() in [s.name.lower() for s in profile.skills] for skill in skills)
        ]
    
    return len(profiles)