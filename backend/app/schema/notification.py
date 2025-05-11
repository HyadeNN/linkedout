from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schema.user import UserResponse

class NotificationBase(BaseModel):
    user_id: int
    type: str
    message: str
    source_id: Optional[int] = None
    source_type: Optional[str] = None
    created_by: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationInDB(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True

class NotificationWithUser(NotificationInDB):
    creator: Optional[UserResponse] = None