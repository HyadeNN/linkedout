from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(50), nullable=False)  # connection_request, post_like, comment, etc.
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    source_id = Column(Integer, nullable=True)  # ID of related entity (post_id, connection_id, etc.)
    source_type = Column(String(50), nullable=True)  # Type of the related entity (post, connection, etc.)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Define relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    creator = relationship("User", foreign_keys=[created_by])