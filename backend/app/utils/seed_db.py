import logging
from sqlalchemy.orm import Session
from app.model.user import User
from app.model.profile import Profile
from app.utils.security import get_password_hash

logger = logging.getLogger(__name__)


def seed_database(db: Session):
    """Seed the database with initial data for testing."""
    try:
        # Check if users already exist
        user_count = db.query(User).count()
        if user_count > 0:
            logger.info("Database already has users, skipping seed process")
            return

        logger.info("Seeding database with initial data...")

        # Create test users
        test_users = [
            {
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "password": "adminpassword",
                "role": "admin",
                "is_verified": True
            },
            {
                "email": "employer@example.com",
                "first_name": "Employer",
                "last_name": "User",
                "password": "employerpassword",
                "role": "employer",
                "is_verified": True
            },
            {
                "email": "user@example.com",
                "first_name": "Regular",
                "last_name": "User",
                "password": "userpassword",
                "role": "user",
                "is_verified": True
            }
        ]

        created_users = []

        for user_data in test_users:
            user = User(
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_verified=user_data["is_verified"],
                is_active=True
            )
            db.add(user)
            db.flush()  # Get ID without committing

            # Create basic profile
            profile = Profile(
                user_id=user.id,
                headline=f"{user_data['first_name']} {user_data['last_name']} - {user_data['role'].capitalize()}",
                about=f"This is a test {user_data['role']} account."
            )
            db.add(profile)

            created_users.append(user)

        db.commit()
        logger.info(f"Created {len(created_users)} test users")

        for user in created_users:
            logger.info(f"User created: {user.email} (role: {user.role})")

        return created_users

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {str(e)}")
        raise