from datetime import datetime
from typing import Optional, Dict, Any

class Post:
    """Post model for Firestore."""
    def __init__(
        self,
        author_id: str,
        content: str,
        image_url: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        post_id: Optional[str] = None
    ):
        self.post_id = post_id
        self.author_id = author_id
        self.content = content
        self.image_url = image_url
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "author_id": self.author_id,
            "content": self.content,
            "image_url": self.image_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], post_id: Optional[str] = None) -> 'Post':
        return cls(
            author_id=data["author_id"],
            content=data["content"],
            image_url=data.get("image_url"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            post_id=post_id
        )

class Comment:
    """Comment model for Firestore."""
    def __init__(
        self,
        post_id: str,
        author_id: str,
        content: str,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        comment_id: Optional[str] = None
    ):
        self.comment_id = comment_id
        self.post_id = post_id
        self.author_id = author_id
        self.content = content
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "post_id": self.post_id,
            "author_id": self.author_id,
            "content": self.content,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], comment_id: Optional[str] = None) -> 'Comment':
        return cls(
            post_id=data["post_id"],
            author_id=data["author_id"],
            content=data["content"],
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            comment_id=comment_id
        )

class Like:
    """Like model for Firestore."""
    def __init__(
        self,
        post_id: str,
        user_id: str,
        created_at: Optional[datetime] = None,
        like_id: Optional[str] = None
    ):
        self.like_id = like_id
        self.post_id = post_id
        self.user_id = user_id
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "post_id": self.post_id,
            "user_id": self.user_id,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], like_id: Optional[str] = None) -> 'Like':
        return cls(
            post_id=data["post_id"],
            user_id=data["user_id"],
            created_at=data.get("created_at"),
            like_id=like_id
        )

class CommentLike:
    """CommentLike model for Firestore."""
    def __init__(
        self,
        comment_id: str,
        user_id: str,
        created_at: Optional[datetime] = None,
        comment_like_id: Optional[str] = None
    ):
        self.comment_like_id = comment_like_id
        self.comment_id = comment_id
        self.user_id = user_id
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "comment_id": self.comment_id,
            "user_id": self.user_id,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], comment_like_id: Optional[str] = None) -> 'CommentLike':
        return cls(
            comment_id=data["comment_id"],
            user_id=data["user_id"],
            created_at=data.get("created_at"),
            comment_like_id=comment_like_id
        )