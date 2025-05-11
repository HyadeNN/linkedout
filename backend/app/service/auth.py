from typing import Optional, Dict, Any
from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.model.user import User
from app.schema.user import UserCreate, UserLogin, PasswordReset, PasswordResetConfirm, VerifyEmail
from app.utils.security import get_password_hash, verify_password, create_access_token, generate_verification_code
from app.utils.email import send_verification_email, send_password_reset_email
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)


def register_user(db: Session, user_data: UserCreate) -> User:
    """Register a new user."""
    logger.info(f"Attempting to register user with email: {user_data.email}")

    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        logger.warning(f"Registration failed: Email already registered: {user_data.email}")
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    verification_code = generate_verification_code()

    try:
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

        logger.info(f"User registered successfully: {user_data.email}")

        # Send verification email
        send_verification_email(user_data.email, verification_code)
        logger.info(f"Verification email sent to: {user_data.email}")

        return db_user
    except Exception as e:
        db.rollback()
        logger.error(f"Error during user registration: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")


def verify_user_email(db: Session, verification_data: VerifyEmail) -> bool:
    """Verify a user's email with the provided token."""
    logger.info(f"Attempting to verify email with token: {verification_data.token[:10]}...")

    db_user = db.query(User).filter(User.verification_code == verification_data.token).first()
    if not db_user:
        logger.warning(f"Email verification failed: Invalid verification code")
        raise HTTPException(status_code=400, detail="Invalid verification code")

    try:
        db_user.is_verified = True
        db_user.verification_code = None
        db.commit()

        logger.info(f"Email verified successfully for user: {db_user.email}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error during email verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Email verification failed. Please try again.")


def login_user(db: Session, login_data: UserLogin) -> Dict[str, Any]:
    """Authenticate a user and return an access token."""
    logger.info(f"Login attempt for email: {login_data.email}")

    db_user = db.query(User).filter(User.email == login_data.email).first()
    if not db_user:
        logger.warning(f"Login failed: User not found for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, db_user.hashed_password):
        logger.warning(f"Login failed: Incorrect password for user: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.is_active:
        logger.warning(f"Login failed: User is inactive: {login_data.email}")
        raise HTTPException(status_code=400, detail="User is inactive")

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires
    )

    logger.info(f"Login successful for user: {login_data.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id
    }


def request_password_reset(db: Session, reset_data: PasswordReset) -> bool:
    """Request a password reset for a user."""
    logger.info(f"Password reset requested for email: {reset_data.email}")

    db_user = db.query(User).filter(User.email == reset_data.email).first()
    if not db_user:
        # Don't reveal if email exists or not
        logger.info(f"Password reset requested for non-existent email: {reset_data.email}")
        return True

    try:
        # Generate reset token
        reset_token = generate_verification_code()
        db_user.verification_code = reset_token
        db.commit()

        # Send reset email
        send_password_reset_email(db_user.email, reset_token)
        logger.info(f"Password reset email sent to: {db_user.email}")

        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error during password reset request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset. Please try again.")


def reset_password(db: Session, reset_data: PasswordResetConfirm) -> bool:
    """Reset a user's password with the provided token."""
    logger.info(f"Attempting to reset password with token: {reset_data.token[:10]}...")

    db_user = db.query(User).filter(User.verification_code == reset_data.token).first()
    if not db_user:
        logger.warning(f"Password reset failed: Invalid reset token")
        raise HTTPException(status_code=400, detail="Invalid reset token")

    try:
        # Update password
        db_user.hashed_password = get_password_hash(reset_data.password)
        db_user.verification_code = None
        db.commit()

        logger.info(f"Password reset successfully for user: {db_user.email}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error during password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Password reset failed. Please try again.")