from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schema.user import UserResponse

class ConnectionBase(BaseModel):
    receiver_id: int

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionUpdate(BaseModel):
    status: str

class ConnectionInDB(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ConnectionWithUser(ConnectionInDB):
    sender: Optional[UserResponse] = None
    receiver: Optional[UserResponse] = None

class FollowBase(BaseModel):
    followed_id: int

class FollowCreate(FollowBase):
    pass

class FollowInDB(BaseModel):
    id: int
    follower_id: int
    followed_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class FollowWithUser(FollowInDB):
    follower: Optional[UserResponse] = None
    followed: Optional[UserResponse] = None