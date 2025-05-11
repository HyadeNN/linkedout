from typing import Optional, Dict, Any
from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.model.user import User
from app.schema.user import UserCreate, UserLogin, PasswordReset, PasswordResetConfirm, VerifyEmail
from app.utils.security import get_password_hash, verify_password, create_access_token, generate_verification_code
from app.utils.email import send_verification_email, send_password_reset_email
from app.config import settings


def register_user(db: Session, user_data: UserCreate) -> User:
    """Register a new user."""
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    verification_code = generate_verification_code()

    db_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        verification_code=verification_code,
        is_verified=False
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email
    send_verification_email(user_data.email, verification_code)

    return db_user


def verify_user_email(db: Session, verification_data: VerifyEmail) -> bool:
    """Verify a user's email with the provided token."""
    db_user = db.query(User).filter(User.verification_code == verification_data.token).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    db_user.is_verified = True
    db_user.verification_code = None
    db.commit()

    return True


def login_user(db: Session, login_data: UserLogin) -> Dict[str, Any]:
    """Authenticate a user and return an access token."""
    db_user = db.query(User).filter(User.email == login_data.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.is_active:
        raise HTTPException(status_code=400, detail="User is inactive")

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id
    }


def request_password_reset(db: Session, reset_data: PasswordReset) -> bool:
    """Request a password reset for a user."""
    db_user = db.query(User).filter(User.email == reset_data.email).first()
    if not db_user:
        # Don't reveal if email exists or not
        return True

    # Generate reset token
    reset_token = generate_verification_code()
    db_user.verification_code = reset_token
    db.commit()

    # Send reset email
    send_password_reset_email(db_user.email, reset_token)

    return True


def reset_password(db: Session, reset_data: PasswordResetConfirm) -> bool:
    """Reset a user's password with the provided token."""
    db_user = db.query(User).filter(User.verification_code == reset_data.token).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    # Update password
    db_user.hashed_password = get_password_hash(reset_data.password)
    db_user.verification_code = None
    db.commit()

    return True