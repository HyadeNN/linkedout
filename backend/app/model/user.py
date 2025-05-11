from datetime import datetime
from typing import Optional, Dict, Any

class User:
    """User model for Firestore."""
    
    def __init__(
        self,
        email: str,
        first_name: str,
        last_name: str,
        firebase_uid: str,
        is_active: bool = True,
        is_verified: bool = False,
        role: str = "user",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.firebase_uid = firebase_uid
        self.is_active = is_active
        self.is_verified = is_verified
        self.role = role
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert user object to dictionary for Firestore."""
        return {
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "firebase_uid": self.firebase_uid,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "role": self.role,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create user object from Firestore dictionary."""
        return cls(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            firebase_uid=data["firebase_uid"],
            is_active=data.get("is_active", True),
            is_verified=data.get("is_verified", False),
            role=data.get("role", "user"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )