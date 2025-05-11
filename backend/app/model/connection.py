from datetime import datetime
from typing import Optional, Dict, Any

class Connection:
    """Connection model for Firestore."""
    def __init__(
        self,
        sender_id: str,
        receiver_id: str,
        status: str = "pending",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        connection_id: Optional[str] = None
    ):
        self.connection_id = connection_id
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.status = status
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], connection_id: Optional[str] = None) -> 'Connection':
        return cls(
            sender_id=data["sender_id"],
            receiver_id=data["receiver_id"],
            status=data.get("status", "pending"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            connection_id=connection_id
        )


class Follow:
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Define relationships
    follower = relationship("User", foreign_keys=[follower_id])
    followed = relationship("User", foreign_keys=[followed_id])