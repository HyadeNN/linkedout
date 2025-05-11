from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_active_user
from app.service import post as post_service
from app.model.user import User
from app.schema.post import (
    PostInDB, PostCreate, PostUpdate, PostWithUser,
    CommentInDB, CommentCreate, CommentUpdate, CommentWithUser,
    LikeInDB, LikeCreate, CommentLikeCreate
)
from app.utils.helpers import paginate_response

router = APIRouter()


# Post endpoints
@router.post("/", response_model=PostInDB, status_code=status.HTTP_201_CREATED)
async def create_post(
        content: str = Form(...),
        image: Optional[UploadFile] = File(None),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Create a new post."""
    post_data = PostCreate(content=content)
    return post_service.create_post(db, current_user.id, post_data, image)


@router.put("/{post_id}", response_model=PostInDB)
def update_post(
        post_id: int,
        post_data: PostUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update a post."""
    return post_service.update_post(db, post_id, current_user.id, post_data)


@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a post."""
    post_service.delete_post(db, post_id, current_user.id)
    return {"message": "Post deleted successfully"}


@router.get("/{post_id}", response_model=PostWithUser)
def get_post(
        post_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get a post by ID."""
    post = post_service.get_post(db, post_id)

    # Add comments and likes count
    post.comments_count = post_service.count_post_comments(db, post_id)
    post.likes_count = post_service.count_post_likes(db, post_id)

    return post


@router.get("/", response_model=Dict)
def get_feed_posts(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get posts for user's feed."""
    skip = (page - 1) * limit
    posts = post_service.get_feed_posts(db, current_user.id, skip, limit)
    total = post_service.count_feed_posts(db, current_user.id)

    # Add comments and likes count to each post
    for post in posts:
        post.comments_count = post_service.count_post_comments(db, post.id)
        post.likes_count = post_service.count_post_likes(db, post.id)

    return paginate_response(posts, page, limit, total)


@router.get("/user/{user_id}", response_model=Dict)
def get_user_posts(
        user_id: int,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all posts by a specific user."""
    skip = (page - 1) * limit
    posts = post_service.get_user_posts(db, user_id, skip, limit)
    total = post_service.count_user_posts(db, user_id)

    # Add comments and likes count to each post
    for post in posts:
        post.comments_count = post_service.count_post_comments(db, post.id)
        post.likes_count = post_service.count_post_likes(db, post.id)

    return paginate_response(posts, page, limit, total)


@router.get("/search", response_model=Dict)
def search_posts(
        query: str = Query(..., min_length=2),
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Search for posts by content."""
    skip = (page - 1) * limit
    posts = post_service.search_posts(db, query, current_user.id, skip, limit)
    total = post_service.count_search_posts(db, query, current_user.id)

    # Add comments and likes count to each post
    for post in posts:
        post.comments_count = post_service.count_post_comments(db, post.id)
        post.likes_count = post_service.count_post_likes(db, post.id)

    return paginate_response(posts, page, limit, total)


# Comment endpoints
@router.post("/{post_id}/comments", response_model=CommentInDB, status_code=status.HTTP_201_CREATED)
def create_comment(
        post_id: int,
        comment_data: CommentCreate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Create a new comment on a post."""
    return post_service.create_comment(db, current_user.id, comment_data)


@router.put("/comments/{comment_id}", response_model=CommentInDB)
def update_comment(
        comment_id: int,
        comment_data: CommentUpdate,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Update a comment."""
    return post_service.update_comment(db, comment_id, current_user.id, comment_data)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
        comment_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Delete a comment."""
    post_service.delete_comment(db, comment_id, current_user.id)
    return {"message": "Comment deleted successfully"}


@router.get("/{post_id}/comments", response_model=Dict)
def get_post_comments(
        post_id: int,
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all comments for a post."""
    skip = (page - 1) * limit
    comments = post_service.get_post_comments(db, post_id, skip, limit)
    total = post_service.count_post_comments(db, post_id)

    # Add likes count to each comment
    for comment in comments:
        comment.likes_count = post_service.count_comment_likes(db, comment.id)

    return paginate_response(comments, page, limit, total)


# Like endpoints
@router.post("/{post_id}/like", response_model=LikeInDB, status_code=status.HTTP_201_CREATED)
def like_post(
        post_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Like a post."""
    like_data = LikeCreate(post_id=post_id)
    return post_service.like_post(db, current_user.id, like_data)


@router.delete("/{post_id}/like", status_code=status.HTTP_200_OK)
def unlike_post(
        post_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Remove a like from a post."""
    post_service.unlike_post(db, current_user.id, post_id)
    return {"message": "Post unliked successfully"}


@router.post("/comments/{comment_id}/like", status_code=status.HTTP_201_CREATED)
def like_comment(
        comment_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Like a comment."""
    like_data = CommentLikeCreate(comment_id=comment_id)
    post_service.like_comment(db, current_user.id, like_data)
    return {"message": "Comment liked successfully"}


@router.delete("/comments/{comment_id}/like", status_code=status.HTTP_200_OK)
def unlike_comment(
        comment_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Remove a like from a comment."""
    post_service.unlike_comment(db, current_user.id, comment_id)
    return {"message": "Comment unliked successfully"}


@router.get("/{post_id}/likes", response_model=Dict)
def get_post_likes(
        post_id: int,
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all likes for a post."""
    skip = (page - 1) * limit
    likes = post_service.get_post_likes(db, post_id, skip, limit)
    total = post_service.count_post_likes(db, post_id)

    return paginate_response(likes, page, limit, total)


@router.get("/comments/{comment_id}/likes", response_model=Dict)
def get_comment_likes(
        comment_id: int,
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=100),
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Get all likes for a comment."""
    skip = (page - 1) * limit
    likes = post_service.get_comment_likes(db, comment_id, skip, limit)
    total = post_service.count_comment_likes(db, comment_id)

    return paginate_response(likes, page, limit, total)


@router.get("/{post_id}/is-liked")
def is_post_liked(
        post_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
):
    """Check if current user has liked a post."""
    is_liked = post_service.is_post_liked(db, post_id, current_user.id)
    return {"is_liked": is_liked}