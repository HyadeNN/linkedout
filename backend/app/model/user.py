from sqlalchemy import Boolean, Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    role = Column(String(20), default="user")  # user, employer, admin

    # Simplify relationships to avoid circular dependencies
    # Comment out complex relationships for now
    profile = relationship("Profile", back_populates="user", uselist=False)
    # posts = relationship("Post", back_populates="author")
    # comments = relationship("Comment", back_populates="author")
    # sent_connections = relationship("Connection",
    #                                 foreign_keys="Connection.sender_id",
    #                                 back_populates="sender")
    # received_connections = relationship("Connection",
    #                                     foreign_keys="Connection.receiver_id",
    #                                     back_populates="receiver")
    # job_posts = relationship("Job", back_populates="poster")
    # job_applications = relationship("JobApplication", back_populates="applicant")