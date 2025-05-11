from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from firebase_admin import firestore

from app.model.user import User
from app.schema.user import UserUpdate
from app.utils.security import get_password_hash


def get_user(db: Session, user_id: int) -> User:
    """Get a user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_by_email(db: firestore.Client, email: str) -> Optional[User]:
    """Get a user by email."""
    users_ref = db.collection('users')
    query = users_ref.where('email', '==', email).limit(1)
    docs = query.get()
    
    if not docs:
        return None
    
    doc = docs[0]
    return User.from_dict(doc.to_dict(), doc.id)


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


def search_users(db: firestore.Client, query: str, skip: int = 0, limit: int = 20) -> List[User]:
    """Search for users by name or email."""
    users_ref = db.collection('users')
    
    # Firestore doesn't support OR queries directly, so we'll do multiple queries
    first_name_query = users_ref.where('first_name', '>=', query).where('first_name', '<=', query + '\uf8ff')
    last_name_query = users_ref.where('last_name', '>=', query).where('last_name', '<=', query + '\uf8ff')
    email_query = users_ref.where('email', '>=', query).where('email', '<=', query + '\uf8ff')
    
    # Get results from all queries
    results = set()
    for doc in first_name_query.get():
        results.add((doc.id, doc.to_dict()))
    for doc in last_name_query.get():
        results.add((doc.id, doc.to_dict()))
    for doc in email_query.get():
        results.add((doc.id, doc.to_dict()))
    
    # Convert to User objects and apply pagination
    users = [User.from_dict(data, doc_id) for doc_id, data in results]
    return users[skip:skip + limit]


def count_search_users(db: firestore.Client, query: str) -> int:
    """Count the number of users matching a search query."""
    users_ref = db.collection('users')
    
    # Similar to search_users but just count
    first_name_query = users_ref.where('first_name', '>=', query).where('first_name', '<=', query + '\uf8ff')
    last_name_query = users_ref.where('last_name', '>=', query).where('last_name', '<=', query + '\uf8ff')
    email_query = users_ref.where('email', '>=', query).where('email', '<=', query + '\uf8ff')
    
    results = set()
    for doc in first_name_query.get():
        results.add(doc.id)
    for doc in last_name_query.get():
        results.add(doc.id)
    for doc in email_query.get():
        results.add(doc.id)
    
    return len(results)