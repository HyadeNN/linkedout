from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.model.user import User
from app.schema.user import UserUpdate
from app.utils.security import get_password_hash


def get_user(db: Session, user_id: int) -> User:
    """Get a user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    """Update a user's information."""
    db_user = get_user(db, user_id)

    # Update user fields
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def update_password(db: Session, user_id: int, current_password: str, new_password: str) -> bool:
    """Update a user's password."""
    from app.utils.security import verify_password

    db_user = get_user(db, user_id)

    # Verify current password
    if not verify_password(current_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()

    return True


def deactivate_user(db: Session, user_id: int) -> bool:
    """Deactivate a user account."""
    db_user = get_user(db, user_id)

    # Set user as inactive
    db_user.is_active = False
    db.commit()

    return True


def search_users(db: Session, query: str, skip: int = 0, limit: int = 20) -> List[User]:
    """Search for users by name or email."""
    search_term = f"%{query}%"

    return db.query(User).filter(
        (User.first_name.ilike(search_term)) |
        (User.last_name.ilike(search_term)) |
        (User.email.ilike(search_term))
    ).offset(skip).limit(limit).all()


def count_search_users(db: Session, query: str) -> int:
    """Count the number of users matching a search query."""
    search_term = f"%{query}%"

    return db.query(User).filter(
        (User.first_name.ilike(search_term)) |
        (User.last_name.ilike(search_term)) |
        (User.email.ilike(search_term))
    ).count()