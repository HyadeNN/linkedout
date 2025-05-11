from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, not_
from firebase_admin import firestore

from app.model.connection import Connection, Follow
from app.model.user import User
from app.model.notification import Notification
from app.schema.connection import ConnectionCreate, ConnectionUpdate, FollowCreate


def get_connection(db: firestore.Client, user_id: str, connected_user_id: str) -> Optional[Connection]:
    """Get connection between two users."""
    connections_ref = db.collection('connections')
    query = connections_ref.where('user_id', '==', user_id).where('connected_user_id', '==', connected_user_id)
    docs = query.get()
    
    if not docs:
        return None
    
    return Connection.from_dict(docs[0].to_dict())


def get_connections(db: firestore.Client, user_id: str, skip: int = 0, limit: int = 100) -> List[Connection]:
    """Get all connections for a user."""
    connections_ref = db.collection('connections')
    query = connections_ref.where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Apply pagination
    if skip > 0:
        query = query.offset(skip)
    if limit > 0:
        query = query.limit(limit)
    
    docs = query.get()
    return [Connection.from_dict(doc.to_dict()) for doc in docs]


def create_connection(db: firestore.Client, user_id: str, connected_user_id: str) -> Connection:
    """Create a new connection."""
    # Check if connection already exists
    existing = get_connection(db, user_id, connected_user_id)
    if existing:
        return existing
    
    # Create new connection
    connection = Connection(
        user_id=user_id,
        connected_user_id=connected_user_id,
        status='pending'
    )
    
    # Add to Firestore
    connections_ref = db.collection('connections')
    doc_ref = connections_ref.add(connection.to_dict())[1]
    
    # Get the created document
    doc = doc_ref.get()
    return Connection.from_dict(doc.to_dict())


def update_connection_status(db: firestore.Client, user_id: str, connected_user_id: str, status: str) -> Optional[Connection]:
    """Update connection status."""
    connections_ref = db.collection('connections')
    query = connections_ref.where('user_id', '==', user_id).where('connected_user_id', '==', connected_user_id)
    docs = query.get()
    
    if not docs:
        return None
    
    # Update the connection
    doc_ref = docs[0].reference
    doc_ref.update({'status': status})
    
    # Get the updated document
    doc = doc_ref.get()
    return Connection.from_dict(doc.to_dict())


def delete_connection(db: firestore.Client, user_id: str, connected_user_id: str) -> bool:
    """Delete a connection."""
    connections_ref = db.collection('connections')
    query = connections_ref.where('user_id', '==', user_id).where('connected_user_id', '==', connected_user_id)
    docs = query.get()
    
    if not docs:
        return False
    
    # Delete the connection
    docs[0].reference.delete()
    return True


def get_connection_count(db: firestore.Client, user_id: str) -> int:
    """Get total number of connections for a user."""
    connections_ref = db.collection('connections')
    query = connections_ref.where('user_id', '==', user_id)
    return len(query.get())


def get_connection_by_users(db: Session, sender_id: int, receiver_id: int) -> Optional[Connection]:
    """Get a connection between two users."""
    return db.query(Connection).filter(
        ((Connection.sender_id == sender_id) & (Connection.receiver_id == receiver_id)) |
        ((Connection.sender_id == receiver_id) & (Connection.receiver_id == sender_id))
    ).first()


def create_connection_request(db: Session, sender_id: int, connection_data: ConnectionCreate) -> Connection:
    """Create a new connection request."""
    # Check if users are the same
    if sender_id == connection_data.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    # Check if connection already exists
    existing_connection = get_connection_by_users(db, sender_id, connection_data.receiver_id)
    if existing_connection:
        raise HTTPException(status_code=400,
                            detail=f"Connection already exists with status: {existing_connection.status}")

    # Create connection request
    db_connection = Connection(
        sender_id=sender_id,
        receiver_id=connection_data.receiver_id,
        status="pending"
    )

    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)

    # Create notification for receiver
    sender = db.query(User).filter(User.id == sender_id).first()

    notification = Notification(
        user_id=connection_data.receiver_id,
        type="connection_request",
        message=f"{sender.first_name} {sender.last_name} sent you a connection request",
        source_id=db_connection.id,
        source_type="connection",
        created_by=sender_id
    )

    db.add(notification)
    db.commit()

    return db_connection


def update_connection_status(db: Session, connection_id: int, user_id: int,
                             connection_data: ConnectionUpdate) -> Connection:
    """Update a connection request status."""
    db_connection = get_connection(db, connection_id)

    # Check if user is the receiver of the request
    if db_connection.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Only the receiver can update the connection status")

    # Check if status is valid
    valid_statuses = ["accepted", "rejected"]
    if connection_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")

    # Update status
    db_connection.status = connection_data.status
    db.commit()
    db.refresh(db_connection)

    # Create notification for sender if accepted
    if connection_data.status == "accepted":
        receiver = db.query(User).filter(User.id == user_id).first()

        notification = Notification(
            user_id=db_connection.sender_id,
            type="connection_accepted",
            message=f"{receiver.first_name} {receiver.last_name} accepted your connection request",
            source_id=db_connection.id,
            source_type="connection",
            created_by=user_id
        )

        db.add(notification)
        db.commit()

    return db_connection


def get_user_connections(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Connection]:
    """Get all connections for a user with status 'accepted'."""
    return db.query(Connection).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).offset(skip).limit(limit).all()


def count_user_connections(db: Session, user_id: int) -> int:
    """Count the number of connections for a user with status 'accepted'."""
    return db.query(Connection).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).count()


def get_connection_requests(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Connection]:
    """Get all pending connection requests received by a user."""
    return db.query(Connection).filter(
        (Connection.receiver_id == user_id) &
        (Connection.status == "pending")
    ).offset(skip).limit(limit).all()


def count_connection_requests(db: Session, user_id: int) -> int:
    """Count the number of pending connection requests received by a user."""
    return db.query(Connection).filter(
        (Connection.receiver_id == user_id) &
        (Connection.status == "pending")
    ).count()


def get_sent_connection_requests(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Connection]:
    """Get all pending connection requests sent by a user."""
    return db.query(Connection).filter(
        (Connection.sender_id == user_id) &
        (Connection.status == "pending")
    ).offset(skip).limit(limit).all()


def count_sent_connection_requests(db: Session, user_id: int) -> int:
    """Count the number of pending connection requests sent by a user."""
    return db.query(Connection).filter(
        (Connection.sender_id == user_id) &
        (Connection.status == "pending")
    ).count()


def delete_connection(db: Session, connection_id: int, user_id: int) -> bool:
    """Delete a connection or withdraw a connection request."""
    db_connection = get_connection(db, connection_id)

    # Check if user is part of the connection
    if db_connection.sender_id != user_id and db_connection.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this connection")

    db.delete(db_connection)
    db.commit()

    return True


def get_connection_suggestions(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[User]:
    """Get connection suggestions for a user (connections of connections)."""
    # Get user's existing connections (both accepted and pending)
    user_connections = db.query(Connection).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id))
    ).all()

    # Get IDs of users already connected or with pending requests
    connected_ids = set()
    for conn in user_connections:
        if conn.sender_id == user_id:
            connected_ids.add(conn.receiver_id)
        else:
            connected_ids.add(conn.sender_id)

    # Add user's own ID to excluded list
    connected_ids.add(user_id)

    # Get IDs of user's connections
    accepted_connection_ids = set()
    for conn in user_connections:
        if conn.status == "accepted":
            if conn.sender_id == user_id:
                accepted_connection_ids.add(conn.receiver_id)
            else:
                accepted_connection_ids.add(conn.sender_id)

    # Get connections of user's connections
    suggestions = []

    for connection_id in accepted_connection_ids:
        connections_of_connection = db.query(Connection).filter(
            ((Connection.sender_id == connection_id) | (Connection.receiver_id == connection_id)) &
            (Connection.status == "accepted")
        ).all()

        for conn in connections_of_connection:
            suggestion_id = conn.sender_id if conn.receiver_id == connection_id else conn.receiver_id

            # Skip if user is already connected or it's the user themself
            if suggestion_id in connected_ids:
                continue

            # Add to suggestions and connected_ids to avoid duplicates
            suggestions.append(suggestion_id)
            connected_ids.add(suggestion_id)

            # Break if we have enough suggestions
            if len(suggestions) >= limit + skip:
                break

    # If we don't have enough suggestions, add some random users
    if len(suggestions) < limit + skip:
        random_users = db.query(User).filter(
            (User.id.notin_(connected_ids)) &
            (User.is_active == True)
        ).limit(limit + skip - len(suggestions)).all()

        for user in random_users:
            suggestions.append(user.id)

    # Get user objects for suggestion IDs with pagination
    suggestion_users = db.query(User).filter(
        User.id.in_(suggestions[skip:skip + limit])
    ).all()

    return suggestion_users


def count_connection_suggestions(db: Session, user_id: int) -> int:
    """Estimate the number of connection suggestions for a user."""
    # Count connections of connections (this is an approximation)
    connections_count = count_user_connections(db, user_id)

    # Assuming each connection has an average of 50 connections
    # and about 20% are not already connected to the user
    estimated_suggestions = min(connections_count * 50 * 0.2, 100)

    return int(estimated_suggestions)


def check_connection_status(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """Check the connection status between two users."""
    connection = get_connection_by_users(db, user_id, other_user_id)

    if not connection:
        return {
            "status": "none",
            "connection_id": None
        }

    return {
        "status": connection.status,
        "connection_id": connection.id,
        "is_sender": connection.sender_id == user_id
    }


def get_mutual_connections(db: Session, user_id: int, other_user_id: int, skip: int = 0, limit: int = 20) -> List[User]:
    """Get mutual connections between two users."""
    # Get IDs of users connected to first user
    user1_connections_query = db.query(
        func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('connection_id')
    ).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Get IDs of users connected to second user
    user2_connections_query = db.query(
        func.if_(Connection.sender_id == other_user_id, Connection.receiver_id, Connection.sender_id).label(
            'connection_id')
    ).filter(
        ((Connection.sender_id == other_user_id) | (Connection.receiver_id == other_user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Find intersection
    mutual_connection_ids = db.query(user1_connections_query.c.connection_id).filter(
        user1_connections_query.c.connection_id.in_(
            db.query(user2_connections_query.c.connection_id)
        )
    ).offset(skip).limit(limit).all()

    # Convert to list of IDs
    mutual_ids = [id[0] for id in mutual_connection_ids]

    # Get user objects
    mutual_users = db.query(User).filter(User.id.in_(mutual_ids)).all()

    return mutual_users


def count_mutual_connections(db: Session, user_id: int, other_user_id: int) -> int:
    """Count mutual connections between two users."""
    # Get IDs of users connected to first user
    user1_connections_query = db.query(
        func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('connection_id')
    ).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Get IDs of users connected to second user
    user2_connections_query = db.query(
        func.if_(Connection.sender_id == other_user_id, Connection.receiver_id, Connection.sender_id).label(
            'connection_id')
    ).filter(
        ((Connection.sender_id == other_user_id) | (Connection.receiver_id == other_user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Count intersection
    return db.query(user1_connections_query.c.connection_id).filter(
        user1_connections_query.c.connection_id.in_(
            db.query(user2_connections_query.c.connection_id)
        )
    ).count()


# Follow functionality
def follow_user(db: Session, follower_id: int, follow_data: FollowCreate) -> Follow:
    """Follow a user."""
    # Check if users are the same
    if follower_id == follow_data.followed_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check if already following
    existing_follow = db.query(Follow).filter(
        (Follow.follower_id == follower_id) &
        (Follow.followed_id == follow_data.followed_id)
    ).first()

    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    # Create follow
    db_follow = Follow(
        follower_id=follower_id,
        followed_id=follow_data.followed_id
    )

    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)

    # Create notification
    follower = db.query(User).filter(User.id == follower_id).first()

    notification = Notification(
        user_id=follow_data.followed_id,
        type="new_follower",
        message=f"{follower.first_name} {follower.last_name} started following you",
        source_id=db_follow.id,
        source_type="follow",
        created_by=follower_id
    )

    db.add(notification)
    db.commit()

    return db_follow


def unfollow_user(db: Session, follower_id: int, followed_id: int) -> bool:
    """Unfollow a user."""
    # Check if following
    db_follow = db.query(Follow).filter(
        (Follow.follower_id == follower_id) &
        (Follow.followed_id == followed_id)
    ).first()

    if not db_follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    db.delete(db_follow)
    db.commit()

    return True


def get_followers(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Follow]:
    """Get all followers of a user."""
    return db.query(Follow).filter(Follow.followed_id == user_id).offset(skip).limit(limit).all()


def count_followers(db: Session, user_id: int) -> int:
    """Count the number of followers of a user."""
    return db.query(Follow).filter(Follow.followed_id == user_id).count()


def get_following(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Follow]:
    """Get all users that a user is following."""
    return db.query(Follow).filter(Follow.follower_id == user_id).offset(skip).limit(limit).all()


def count_following(db: Session, user_id: int) -> int:
    """Count the number of users that a user is following."""
    return db.query(Follow).filter(Follow.follower_id == user_id).count()


def is_following(db: Session, follower_id: int, followed_id: int) -> bool:
    """Check if a user is following another user."""
    return db.query(Follow).filter(
        (Follow.follower_id == follower_id) &
        (Follow.followed_id == followed_id)
    ).first() is not None