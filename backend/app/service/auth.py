from typing import Optional, Dict, Any
from datetime import timedelta
from fastapi import HTTPException, status
import logging
from firebase_admin import auth
from firebase_admin import firestore

from app.model.user import User
from app.schema.user import UserCreate, UserLogin, FirebaseLogin, PasswordReset, PasswordResetConfirm, VerifyEmail
from app.utils.security import get_password_hash, verify_password, create_access_token, generate_verification_code
from app.utils.email import send_verification_email, send_password_reset_email
from app.config import settings
from app.core.firebase_config import verify_firebase_token

# Configure logging
logger = logging.getLogger(__name__)


def register_user(db: firestore.Client, user_data: UserCreate) -> User:
    """Register a new user using Firebase Authentication."""
    logger.info(f"Attempting to register user with email: {user_data.email}")

    try:
        # Create user in Firebase Authentication
        user_record = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=f"{user_data.first_name} {user_data.last_name}"
        )

        # Create user document in Firestore
        user = User(
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            firebase_uid=user_record.uid,
            is_verified=False
        )

        # Save user to Firestore
        db.collection('users').document(user_record.uid).set(user.to_dict())
        logger.info(f"User registered successfully: {user_data.email}")

        return user

    except auth.EmailAlreadyExistsError:
        logger.warning(f"Registration failed: Email already registered: {user_data.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        logger.error(f"Error during user registration: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")


def verify_user_email(db: firestore.Client, verification_data: VerifyEmail) -> bool:
    """Verify a user's email with the provided token."""
    logger.info(f"Attempting to verify email with token: {verification_data.token[:10]}...")

    user_doc = db.collection('users').document(verification_data.token).get()
    if not user_doc.exists:
        logger.warning(f"Email verification failed: Invalid verification code")
        raise HTTPException(status_code=400, detail="Invalid verification code")

    try:
        user = User.from_dict(user_doc.to_dict())
        user.is_verified = True
        user.verification_code = None
        db.collection('users').document(verification_data.token).set(user.to_dict())

        logger.info(f"Email verified successfully for user: {user.email}")
        return True
    except Exception as e:
        logger.error(f"Error during email verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Email verification failed. Please try again.")


def login_with_firebase(db: firestore.Client, login_data: FirebaseLogin) -> Dict[str, Any]:
    """Authenticate a user using Firebase token and return an access token."""
    logger.info("Attempting Firebase login")

    try:
        # Verify Firebase token
        decoded_token = verify_firebase_token(login_data.id_token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Firebase token")

        # Get user from Firestore
        user_doc = db.collection('users').document(firebase_uid).get()
        
        if not user_doc.exists:
            # Create new user if doesn't exist
            user = User(
                email=email,
                first_name=decoded_token.get('name', '').split()[0] if decoded_token.get('name') else '',
                last_name=decoded_token.get('name', '').split()[-1] if decoded_token.get('name') else '',
                firebase_uid=firebase_uid,
                is_verified=True  # Firebase email is already verified
            )
            db.collection('users').document(firebase_uid).set(user.to_dict())
            logger.info(f"Created new user from Firebase: {email}")
        else:
            user = User.from_dict(user_doc.to_dict())

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": firebase_uid}, expires_delta=access_token_expires
        )

        logger.info(f"Firebase login successful for user: {email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": firebase_uid
        }

    except Exception as e:
        logger.error(f"Firebase login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def login_user(db: firestore.Client, login_data: UserLogin) -> Dict[str, Any]:
    """Authenticate a user and return an access token."""
    logger.info(f"Login attempt for email: {login_data.email}")

    user_doc = db.collection('users').document(login_data.email).get()
    if not user_doc.exists:
        logger.warning(f"Login failed: User not found for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = User.from_dict(user_doc.to_dict())

    if not verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Login failed: Incorrect password for user: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Login failed: User is inactive: {login_data.email}")
        raise HTTPException(status_code=400, detail="User is inactive")

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": login_data.email}, expires_delta=access_token_expires
    )

    logger.info(f"Login successful for user: {login_data.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": login_data.email
    }


def request_password_reset(db: firestore.Client, reset_data: PasswordReset) -> bool:
    """Request a password reset for a user."""
    logger.info(f"Password reset requested for email: {reset_data.email}")

    user_doc = db.collection('users').document(reset_data.email).get()
    if not user_doc.exists:
        # Don't reveal if email exists or not
        logger.info(f"Password reset requested for non-existent email: {reset_data.email}")
        return True

    try:
        # Generate reset token
        reset_token = generate_verification_code()
        user = User.from_dict(user_doc.to_dict())
        user.verification_code = reset_token
        db.collection('users').document(reset_data.email).set(user.to_dict())

        # Send reset email
        send_password_reset_email(reset_data.email, reset_token)
        logger.info(f"Password reset email sent to: {reset_data.email}")

        return True
    except Exception as e:
        logger.error(f"Error during password reset request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset. Please try again.")


def reset_password(db: firestore.Client, reset_data: PasswordResetConfirm) -> bool:
    """Reset a user's password with the provided token."""
    logger.info(f"Attempting to reset password with token: {reset_data.token[:10]}...")

    user_doc = db.collection('users').document(reset_data.email).get()
    if not user_doc.exists:
        logger.warning(f"Password reset failed: Invalid reset token")
        raise HTTPException(status_code=400, detail="Invalid reset token")

    try:
        # Update password
        user = User.from_dict(user_doc.to_dict())
        user.hashed_password = get_password_hash(reset_data.password)
        user.verification_code = None
        db.collection('users').document(reset_data.email).set(user.to_dict())

        logger.info(f"Password reset successfully for user: {reset_data.email}")
        return True
    except Exception as e:
        logger.error(f"Error during password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Password reset failed. Please try again.")