from typing import List, Optional, Dict, Any
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_

from app.model.post import Post, Comment, Like, CommentLike
from app.model.user import User
from app.model.connection import Connection
from app.model.notification import Notification
from app.schema.post import PostCreate, PostUpdate, CommentCreate, CommentUpdate, LikeCreate, CommentLikeCreate
from app.utils.helpers import save_image_with_resize


def get_post(db: Session, post_id: int) -> Post:
    """Get a post by ID."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def create_post(db: Session, author_id: int, post_data: PostCreate, image: Optional[UploadFile] = None) -> Post:
    """Create a new post."""
    # Handle image upload
    image_url = None
    if image:
        image_url = save_image_with_resize(
            image,
            folder="post_images",
            max_width=1200,
            max_height=1200
        )

    # Create post
    db_post = Post(
        author_id=author_id,
        content=post_data.content,
        image_url=image_url
    )

    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # Create notifications for connections
    create_post_notifications(db, db_post)

    return db_post


def create_post_notifications(db: Session, post: Post) -> None:
    """Create notifications for a new post."""
    # Get all connections of the post author
    connections = db.query(Connection).filter(
        ((Connection.sender_id == post.author_id) | (Connection.receiver_id == post.author_id)) &
        (Connection.status == "accepted")
    ).all()

    # Get post author
    author = db.query(User).filter(User.id == post.author_id).first()

    # Create notifications for each connection
    for connection in connections:
        # Determine the connection's user ID
        connection_user_id = connection.receiver_id if connection.sender_id == post.author_id else connection.sender_id

        notification = Notification(
            user_id=connection_user_id,
            type="new_post",
            message=f"{author.first_name} {author.last_name} created a new post",
            source_id=post.id,
            source_type="post",
            created_by=post.author_id
        )

        db.add(notification)

    db.commit()


def update_post(db: Session, post_id: int, user_id: int, post_data: PostUpdate) -> Post:
    """Update a post."""
    db_post = get_post(db, post_id)

    # Check if user is the author
    if db_post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    # Update post fields
    for field, value in post_data.dict(exclude_unset=True).items():
        setattr(db_post, field, value)

    db.commit()
    db.refresh(db_post)
    return db_post


def delete_post(db: Session, post_id: int, user_id: int) -> bool:
    """Delete a post."""
    db_post = get_post(db, post_id)

    # Check if user is the author
    if db_post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.delete(db_post)
    db.commit()

    return True


def get_feed_posts(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Post]:
    """Get posts for a user's feed (posts from connections and followed users)."""
    # Get IDs of users connected to the current user
    connected_users_query = db.query(
        func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('user_id')
    ).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Get posts from connected users and the user's own posts
    return db.query(Post).filter(
        (Post.author_id.in_(db.query(connected_users_query.c.user_id))) |
        (Post.author_id == user_id)
    ).order_by(desc(Post.created_at)).offset(skip).limit(limit).all()


def count_feed_posts(db: Session, user_id: int) -> int:
    """Count the total number of posts in a user's feed."""
    # Get IDs of users connected to the current user
    connected_users_query = db.query(
        func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('user_id')
    ).filter(
        ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
        (Connection.status == "accepted")
    ).subquery()

    # Count posts from connected users and the user's own posts
    return db.query(Post).filter(
        (Post.author_id.in_(db.query(connected_users_query.c.user_id))) |
        (Post.author_id == user_id)
    ).count()


def get_user_posts(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Post]:
    """Get all posts by a specific user."""
    return db.query(Post).filter(Post.author_id == user_id).order_by(desc(Post.created_at)).offset(skip).limit(
        limit).all()


def count_user_posts(db: Session, user_id: int) -> int:
    """Count the total number of posts by a specific user."""
    return db.query(Post).filter(Post.author_id == user_id).count()


# Comment functions
def get_comment(db: Session, comment_id: int) -> Comment:
    """Get a comment by ID."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


def create_comment(db: Session, author_id: int, comment_data: CommentCreate) -> Comment:
    """Create a new comment on a post."""
    # Check if post exists
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Create comment
    db_comment = Comment(
        post_id=comment_data.post_id,
        author_id=author_id,
        content=comment_data.content
    )

    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # Create notification for post author if different from comment author
    if post.author_id != author_id:
        commenter = db.query(User).filter(User.id == author_id).first()

        notification = Notification(
            user_id=post.author_id,
            type="comment",
            message=f"{commenter.first_name} {commenter.last_name} commented on your post",
            source_id=db_comment.id,
            source_type="comment",
            created_by=author_id
        )

        db.add(notification)
        db.commit()

    return db_comment


def update_comment(db: Session, comment_id: int, user_id: int, comment_data: CommentUpdate) -> Comment:
    """Update a comment."""
    db_comment = get_comment(db, comment_id)

    # Check if user is the author
    if db_comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")

    # Update comment fields
    for field, value in comment_data.dict(exclude_unset=True).items():
        setattr(db_comment, field, value)

    db.commit()
    db.refresh(db_comment)
    return db_comment


def delete_comment(db: Session, comment_id: int, user_id: int) -> bool:
    """Delete a comment."""
    db_comment = get_comment(db, comment_id)

    # Check if user is the author or post owner
    post = db.query(Post).filter(Post.id == db_comment.post_id).first()
    if db_comment.author_id != user_id and post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(db_comment)
    db.commit()

    return True


def get_post_comments(db: Session, post_id: int, skip: int = 0, limit: int = 50) -> List[Comment]:
    """Get all comments for a post."""
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).offset(skip).limit(
        limit).all()


def count_post_comments(db: Session, post_id: int) -> int:
    """Count the total number of comments for a post."""
    return db.query(Comment).filter(Comment.post_id == post_id).count()


# Like functions
def like_post(db: Session, user_id: int, like_data: LikeCreate) -> Like:
    """Like a post."""
    # Check if post exists
    post = db.query(Post).filter(Post.id == like_data.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if already liked
    existing_like = db.query(Like).filter(
        (Like.post_id == like_data.post_id) &
        (Like.user_id == user_id)
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")

    # Create like
    db_like = Like(
        post_id=like_data.post_id,
        user_id=user_id
    )

    db.add(db_like)
    db.commit()
    db.refresh(db_like)

    # Create notification for post author if different from like author
    if post.author_id != user_id:
        liker = db.query(User).filter(User.id == user_id).first()

        notification = Notification(
            user_id=post.author_id,
            type="post_like",
            message=f"{liker.first_name} {liker.last_name} liked your post",
            source_id=db_like.id,
            source_type="like",
            created_by=user_id
        )

        db.add(notification)
        db.commit()

    return db_like


def unlike_post(db: Session, user_id: int, post_id: int) -> bool:
    """Remove a like from a post."""
    # Check if liked
    db_like = db.query(Like).filter(
        (Like.post_id == post_id) &
        (Like.user_id == user_id)
    ).first()

    if not db_like:
        raise HTTPException(status_code=404, detail="Post not liked")

    db.delete(db_like)
    db.commit()

    return True


def like_comment(db: Session, user_id: int, like_data: CommentLikeCreate) -> CommentLike:
    """Like a comment."""
    # Check if comment exists
    comment = db.query(Comment).filter(Comment.id == like_data.comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check if already liked
    existing_like = db.query(CommentLike).filter(
        (CommentLike.comment_id == like_data.comment_id) &
        (CommentLike.user_id == user_id)
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Comment already liked")

    # Create like
    db_like = CommentLike(
        comment_id=like_data.comment_id,
        user_id=user_id
    )

    db.add(db_like)
    db.commit()
    db.refresh(db_like)

    # Create notification for comment author if different from like author
    if comment.author_id != user_id:
        liker = db.query(User).filter(User.id == user_id).first()

        notification = Notification(
            user_id=comment.author_id,
            type="comment_like",
            message=f"{liker.first_name} {liker.last_name} liked your comment",
            source_id=db_like.id,
            source_type="comment_like",
            created_by=user_id
        )

        db.add(notification)
        db.commit()

    return db_like


def unlike_comment(db: Session, user_id: int, comment_id: int) -> bool:
    """Remove a like from a comment."""
    # Check if liked
    db_like = db.query(CommentLike).filter(
        (CommentLike.comment_id == comment_id) &
        (CommentLike.user_id == user_id)
    ).first()

    if not db_like:
        raise HTTPException(status_code=404, detail="Comment not liked")

    db.delete(db_like)
    db.commit()

    return True


def get_post_likes(db: Session, post_id: int, skip: int = 0, limit: int = 50) -> List[Like]:
    """Get all likes for a post."""
    return db.query(Like).filter(Like.post_id == post_id).offset(skip).limit(limit).all()


def count_post_likes(db: Session, post_id: int) -> int:
    """Count the total number of likes for a post."""
    return db.query(Like).filter(Like.post_id == post_id).count()


def get_comment_likes(db: Session, comment_id: int, skip: int = 0, limit: int = 50) -> List[CommentLike]:
    """Get all likes for a comment."""
    return db.query(CommentLike).filter(CommentLike.comment_id == comment_id).offset(skip).limit(limit).all()


def count_comment_likes(db: Session, comment_id: int) -> int:
    """Count the total number of likes for a comment."""
    return db.query(CommentLike).filter(CommentLike.comment_id == comment_id).count()


def is_post_liked(db: Session, post_id: int, user_id: int) -> bool:
    """Check if a post is liked by a user."""
    return db.query(Like).filter(
        (Like.post_id == post_id) &
        (Like.user_id == user_id)
    ).first() is not None


def is_comment_liked(db: Session, comment_id: int, user_id: int) -> bool:
    """Check if a comment is liked by a user."""
    return db.query(CommentLike).filter(
        (CommentLike.comment_id == comment_id) &
        (CommentLike.user_id == user_id)
    ).first() is not None


def search_posts(db: Session, query: str, user_id: Optional[int] = None, skip: int = 0, limit: int = 20) -> List[Post]:
    """Search for posts by content."""
    search_query = f"%{query}%"

    # Base query
    posts_query = db.query(Post).filter(Post.content.ilike(search_query))

    # If user_id is provided, restrict to their feed
    if user_id:
        # Get IDs of users connected to the current user
        connected_users_query = db.query(
            func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('user_id')
        ).filter(
            ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
            (Connection.status == "accepted")
        ).subquery()

        # Filter to posts from connected users and the user's own posts
        posts_query = posts_query.filter(
            (Post.author_id.in_(db.query(connected_users_query.c.user_id))) |
            (Post.author_id == user_id)
        )

    # Order by created_at and apply pagination
    return posts_query.order_by(desc(Post.created_at)).offset(skip).limit(limit).all()


def count_search_posts(db: Session, query: str, user_id: Optional[int] = None) -> int:
    """Count the number of posts matching a search query."""
    search_query = f"%{query}%"

    # Base query
    posts_query = db.query(Post).filter(Post.content.ilike(search_query))

    # If user_id is provided, restrict to their feed
    if user_id:
        # Get IDs of users connected to the current user
        connected_users_query = db.query(
            func.if_(Connection.sender_id == user_id, Connection.receiver_id, Connection.sender_id).label('user_id')
        ).filter(
            ((Connection.sender_id == user_id) | (Connection.receiver_id == user_id)) &
            (Connection.status == "accepted")
        ).subquery()

        # Filter to posts from connected users and the user's own posts
        posts_query = posts_query.filter(
            (Post.author_id.in_(db.query(connected_users_query.c.user_id))) |
            (Post.author_id == user_id)
        )

    return posts_query.count()