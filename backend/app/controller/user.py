from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import user as user_service
from app.model.user import User
from app.schema.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information."""
    return user_service.update_user(db, current_user.id, user_data)

@router.put("/me/password", status_code=status.HTTP_200_OK)
def update_current_user_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user password."""
    user_service.update_password(db, current_user.id, current_password, new_password)
    return {"message": "Password updated successfully"}

@router.delete("/me", status_code=status.HTTP_200_OK)
def deactivate_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deactivate current user account."""
    user_service.deactivate_user(db, current_user.id)
    return {"message": "User deactivated successfully"}

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific user by ID."""
    return user_service.get_user(db, user_id)

@router.get("/", response_model=List[UserResponse])
def search_users(
    query: str = Query(..., min_length=2),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search for users by name or email."""
    users = user_service.search_users(db, query, skip, limit)
    return users