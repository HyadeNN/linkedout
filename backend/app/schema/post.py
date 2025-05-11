from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schema.user import UserResponse

class PostBase(BaseModel):
    content: str

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class LikeBase(BaseModel):
    post_id: int

class LikeCreate(LikeBase):
    pass

class CommentLikeBase(BaseModel):
    comment_id: int

class CommentLikeCreate(CommentLikeBase):
    pass

class LikeInDB(BaseModel):
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class LikeWithUser(LikeInDB):
    user: Optional[UserResponse] = None

class CommentLikeInDB(BaseModel):
    id: int
    comment_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class CommentLikeWithUser(CommentLikeInDB):
    user: Optional[UserResponse] = None

class CommentInDB(CommentBase):
    id: int
    post_id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class CommentWithUser(CommentInDB):
    author: Optional[UserResponse] = None
    likes: List[CommentLikeWithUser] = []
    likes_count: Optional[int] = 0

class PostInDB(PostBase):
    id: int
    author_id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class PostWithUser(PostInDB):
    author: Optional[UserResponse] = None
    comments: List[CommentWithUser] = []
    likes: List[LikeWithUser] = []
    comments_count: Optional[int] = 0
    likes_count: Optional[int] = 0