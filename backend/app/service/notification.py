from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.model.notification import Notification
from app.schema.notification import NotificationUpdate


def get_notification(db: Session, notification_id: int) -> Notification:
    """Get a notification by ID."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Notification]:
    """Get all notifications for a user."""
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()


def count_user_notifications(db: Session, user_id: int) -> int:
    """Count the total number of notifications for a user."""
    return db.query(Notification).filter(Notification.user_id == user_id).count()


def count_unread_notifications(db: Session, user_id: int) -> int:
    """Count the number of unread notifications for a user."""
    return db.query(Notification).filter(
        (Notification.user_id == user_id) &
        (Notification.is_read == False)
    ).count()


def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    """Mark a notification as read."""
    db_notification = get_notification(db, notification_id)

    # Check if notification belongs to user
    if db_notification.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")

    # Update notification
    db_notification.is_read = True
    db.commit()
    db.refresh(db_notification)

    return db_notification


def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
    """Mark all notifications for a user as read."""
    # Update all unread notifications
    result = db.query(Notification).filter(
        (Notification.user_id == user_id) &
        (Notification.is_read == False)
    ).update({"is_read": True})

    db.commit()

    return result


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification."""
    db_notification = get_notification(db, notification_id)

    # Check if notification belongs to user
    if db_notification.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

    db.delete(db_notification)
    db.commit()

    return True


def delete_all_notifications(db: Session, user_id: int) -> int:
    """Delete all notifications for a user."""
    # Delete all notifications
    result = db.query(Notification).filter(Notification.user_id == user_id).delete()

    db.commit()

    return result