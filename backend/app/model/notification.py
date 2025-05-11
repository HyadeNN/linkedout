from datetime import datetime
from typing import Optional, Dict, Any

class Notification:
    """Notification model for Firestore."""
    def __init__(
        self,
        user_id: str,
        type: str,
        message: str,
        is_read: bool = False,
        source_id: Optional[str] = None,
        source_type: Optional[str] = None,
        created_by: Optional[str] = None,
        created_at: Optional[datetime] = None,
        notification_id: Optional[str] = None
    ):
        self.notification_id = notification_id
        self.user_id = user_id
        self.type = type
        self.message = message
        self.is_read = is_read
        self.source_id = source_id
        self.source_type = source_type
        self.created_by = created_by
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "type": self.type,
            "message": self.message,
            "is_read": self.is_read,
            "source_id": self.source_id,
            "source_type": self.source_type,
            "created_by": self.created_by,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], notification_id: Optional[str] = None) -> 'Notification':
        return cls(
            user_id=data["user_id"],
            type=data["type"],
            message=data["message"],
            is_read=data.get("is_read", False),
            source_id=data.get("source_id"),
            source_type=data.get("source_type"),
            created_by=data.get("created_by"),
            created_at=data.get("created_at"),
            notification_id=notification_id
        )