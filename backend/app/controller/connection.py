from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import connection as connection_service
from app.model.user import User
from app.schema.connection import (
    ConnectionInDB, ConnectionCreate, ConnectionUpdate, ConnectionWithUser,
    FollowInDB, FollowCreate, FollowWithUser
)
from app.schema.user import UserResponse
from app.utils.helpers import paginate_response

router = APIRouter()


# Connection endpoints
@router.post("/request", response_model=ConnectionInDB, status_code=status.HTTP_201_CREATED)
def create_connection_request(
        connection_data: ConnectionCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Create a new connection request."""
    return connection_service.create_connection_request(db, current_user.id, connection_data)


@router.put("/{connection_id}", response_model=ConnectionInDB)
def update_connection_status(
        connection_id: int,
        connection_data: ConnectionUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update a connection request status (accept/reject)."""
    return connection_service.update_connection_status(db, connection_id, current_user.id, connection_data)


@router.delete("/{connection_id}", status_code=status.HTTP_200_OK)
def delete_connection(
        connection_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a connection or withdraw a connection request."""
    connection_service.delete_connection(db, connection_id, current_user.id)
    return {"message": "Connection removed successfully"}


@router.get("/", response_model=Dict)
def get_my_connections(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all connections for current user."""
    skip = (page - 1) * limit
    connections = connection_service.get_user_connections(db, current_user.id, skip, limit)
    total = connection_service.count_user_connections(db, current_user.id)

    return paginate_response(connections, page, limit, total)


@router.get("/requests", response_model=Dict)
def get_connection_requests(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all pending connection requests received by current user."""
    skip = (page - 1) * limit
    requests = connection_service.get_connection_requests(db, current_user.id, skip, limit)
    total = connection_service.count_connection_requests(db, current_user.id)

    return paginate_response(requests, page, limit, total)


@router.get("/sent-requests", response_model=Dict)
def get_sent_connection_requests(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all pending connection requests sent by current user."""
    skip = (page - 1) * limit
    requests = connection_service.get_sent_connection_requests(db, current_user.id, skip, limit)
    total = connection_service.count_sent_connection_requests(db, current_user.id)

    return paginate_response(requests, page, limit, total)


@router.get("/suggestions", response_model=Dict)
def get_connection_suggestions(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get connection suggestions for current user."""
    skip = (page - 1) * limit
    suggestions = connection_service.get_connection_suggestions(db, current_user.id, skip, limit)
    total = connection_service.count_connection_suggestions(db, current_user.id)

    return paginate_response(suggestions, page, limit, total)


@router.get("/status/{user_id}", response_model=Dict)
def check_connection_status(
        user_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Check the connection status between current user and another user."""
    return connection_service.check_connection_status(db, current_user.id, user_id)


@router.get("/mutual/{user_id}", response_model=Dict)
def get_mutual_connections(
        user_id: int,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get mutual connections between current user and another user."""
    skip = (page - 1) * limit
    mutual = connection_service.get_mutual_connections(db, current_user.id, user_id, skip, limit)
    total = connection_service.count_mutual_connections(db, current_user.id, user_id)

    return paginate_response(mutual, page, limit, total)


# Follow endpoints
@router.post("/follow", response_model=FollowInDB, status_code=status.HTTP_201_CREATED)
def follow_user(
        follow_data: FollowCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Follow a user."""
    return connection_service.follow_user(db, current_user.id, follow_data)


@router.delete("/follow/{user_id}", status_code=status.HTTP_200_OK)
def unfollow_user(
        user_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Unfollow a user."""
    connection_service.unfollow_user(db, current_user.id, user_id)
    return {"message": "User unfollowed successfully"}


@router.get("/followers", response_model=Dict)
def get_my_followers(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all followers of current user."""
    skip = (page - 1) * limit
    followers = connection_service.get_followers(db, current_user.id, skip, limit)
    total = connection_service.count_followers(db, current_user.id)

    return paginate_response(followers, page, limit, total)


@router.get("/following", response_model=Dict)
def get_my_following(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all users that current user is following."""
    skip = (page - 1) * limit
    following = connection_service.get_following(db, current_user.id, skip, limit)
    total = connection_service.count_following(db, current_user.id)

    return paginate_response(following, page, limit, total)


@router.get("/is-following/{user_id}")
def is_following_user(
        user_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Check if current user is following another user."""
    is_following = connection_service.is_following(db, current_user.id, user_id)
    return {"is_following": is_following}