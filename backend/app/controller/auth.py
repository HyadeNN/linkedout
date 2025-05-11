from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.service import auth as auth_service
from app.schema.user import (
    UserCreate, UserResponse, Token, UserLogin, FirebaseLogin,
    PasswordReset, PasswordResetConfirm, VerifyEmail
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    return auth_service.register_user(db, user_data)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token."""
    logger.debug(f"Login attempt received for: {form_data.username}")

    # Create a UserLogin instance from form_data
    user_login = UserLogin(
        email=form_data.username,  # OAuth2 uses username field for email
        password=form_data.password
    )

    logger.debug(f"Created UserLogin instance for: {user_login.email}")

    # Pass the UserLogin instance to the service
    result = auth_service.login_user(db, user_login)

    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"]
    }


@router.post("/login/firebase", response_model=Token)
def login_with_firebase(login_data: FirebaseLogin, db: Session = Depends(get_db)):
    """Login with Firebase token and get access token."""
    logger.debug("Firebase login attempt received")
    result = auth_service.login_with_firebase(db, login_data)
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"]
    }


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(verification_data: VerifyEmail, db: Session = Depends(get_db)):
    """Verify user email with token."""
    auth_service.verify_user_email(db, verification_data)
    return {"message": "Email verified successfully"}


@router.post("/password-reset", status_code=status.HTTP_200_OK)
def request_password_reset(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Request a password reset."""
    auth_service.request_password_reset(db, reset_data)
    return {"message": "If your email is registered, you will receive a password reset link"}


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
def confirm_password_reset(reset_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password with token."""
    auth_service.reset_password(db, reset_data)
    return {"message": "Password reset successfully"}