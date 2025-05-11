from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import notification as notification_service
from app.model.user import User
from app.schema.notification import NotificationInDB, NotificationUpdate, NotificationWithUser
from app.utils.helpers import paginate_response

router = APIRouter()


@router.get("/", response_model=Dict)
def get_notifications(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all notifications for current user."""
    skip = (page - 1) * limit
    notifications = notification_service.get_user_notifications(db, current_user.id, skip, limit)
    total = notification_service.count_user_notifications(db, current_user.id)

    return paginate_response(notifications, page, limit, total)


@router.get("/unread-count")
def get_unread_count(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get the count of unread notifications for current user."""
    count = notification_service.count_unread_notifications(db, current_user.id)
    return {"unread_count": count}


@router.put("/{notification_id}", response_model=NotificationInDB)
def mark_notification_as_read(
        notification_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    return notification_service.mark_notification_as_read(db, notification_id, current_user.id)


@router.put("/mark-all-as-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Mark all notifications for current user as read."""
    count = notification_service.mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
def delete_notification(
        notification_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification_service.delete_notification(db, notification_id, current_user.id)
    return {"message": "Notification deleted successfully"}


@router.delete("/", status_code=status.HTTP_200_OK)
def delete_all_notifications(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete all notifications for current user."""
    count = notification_service.delete_all_notifications(db, current_user.id)
    return {"message": f"{count} notifications deleted"}