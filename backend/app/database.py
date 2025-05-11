from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Connect to database (SQLite for now)
    logger.info(f"Connecting to database at {settings.DATABASE_URL}")

    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

    # Use check_same_thread=False for SQLite
    connect_args = {}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        echo=True,  # Log all SQL queries for debugging
        pool_pre_ping=True  # Check connection before using it
    )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base = declarative_base()

    logger.info("Database connection established successfully")
except Exception as e:
    logger.error(f"Failed to connect to database: {str(e)}")
    raise


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()