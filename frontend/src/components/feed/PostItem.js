import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import CommentSection from './CommentSection';

const PostItem = ({ post, onUpdatePost, onDeletePost, onHashtagClick }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const optionsRef = useRef(null);

  // Check if the post is liked by the current user
  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        const liked = await postService.isPostLiked(post.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Failed to check if post is liked:', error);
      }
    };

    checkIfLiked();
  }, [post.id]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle options menu
  const toggleOptions = () => {
    setShowOptions(prevState => !prevState);
  };

  // Enter edit mode
  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditing(true);
    setShowOptions(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // Save edited post
  const handleSaveEdit = async () => {
    if (editContent.trim() === '') {
      return;
    }

    try {
      setLoading(true);
      const updatedPost = await postService.updatePost(post.id, editContent);
      onUpdatePost({ ...post, ...updatedPost });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete post
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setLoading(true);
        await postService.deletePost(post.id);
        onDeletePost(post.id);
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    setShowOptions(false);
  };

  // Toggle like
  const handleLikeToggle = async () => {
    try {
      setLoading(true);
      if (isLiked) {
        await postService.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(prevCount => prevCount - 1);
      } else {
        await postService.likePost(post.id);
        setIsLiked(true);
        setLikesCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle comments
  const toggleComments = () => {
    setShowComments(prevState => !prevState);
  };

  // Update comments count when a new comment is added
  const handleCommentAdded = () => {
    setCommentsCount(prevCount => prevCount + 1);
  };

  // Update comments count when a comment is deleted
  const handleCommentDeleted = () => {
    setCommentsCount(prevCount => Math.max(0, prevCount - 1));
  };

  const renderHashtags = () => {
    if (!post.hashtags || post.hashtags.length === 0) return null;

    return (
      <div className="post-hashtags">
        {post.hashtags.map((hashtag, index) => (
          <button
            key={index}
            className="post-hashtag"
            onClick={() => onHashtagClick(hashtag)}
          >
            {hashtag}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="post-item">
      <div className="post-header">
        <Link to={`/users/${post.author_id}`} className="post-author">
          <img
            src={post.author?.profile?.profile_image || '/default-avatar.jpg'}
            alt={`${post.author?.first_name} ${post.author?.last_name}`}
            className="author-avatar"
          />
          <div className="author-info">
            <h4 className="author-name">
              {post.author?.first_name} {post.author?.last_name}
            </h4>
            <p className="author-headline">{post.author?.profile?.headline || ''}</p>
            <span className="post-time">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </Link>

        {post.author_id === user?.id && (
          <div className="post-options" ref={optionsRef}>
            <button
              className="options-btn"
              onClick={toggleOptions}
              disabled={loading}
            >
              <span className="options-icon">⋯</span>
            </button>

            {showOptions && (
              <div className="options-menu">
                <button
                  className="option-item"
                  onClick={handleEdit}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  className="option-item delete"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="post-content">
        {isEditing ? (
          <div className="post-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              disabled={loading}
              autoFocus
            />
            <div className="edit-actions">
              <button
                className="cancel-edit-btn"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="save-edit-btn"
                onClick={handleSaveEdit}
                disabled={loading || editContent.trim() === ''}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="post-text">{post.content}</p>
            {renderHashtags()}
          </>
        )}

        {post.image_url && (
          <div className="post-image-container">
            <img
              src={post.image_url}
              alt="Post"
              className="post-image"
            />
          </div>
        )}
      </div>

      <div className="post-stats">
        {likesCount > 0 && (
          <div className="likes-count">
            <span className="like-icon">👍</span>
            <span>{likesCount}</span>
          </div>
        )}

        {commentsCount > 0 && (
          <button className="comments-count" onClick={toggleComments}>
            {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLikeToggle}
          disabled={loading}
        >
          <span className="action-icon">👍</span>
          <span>Like</span>
        </button>

        <button
          className="action-btn"
          onClick={toggleComments}
          disabled={loading}
        >
          <span className="action-icon">💬</span>
          <span>Comment</span>
        </button>

        <button
          className="action-btn"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Post link copied to clipboard!');
          }}
        >
          <span className="action-icon">↗️</span>
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </div>
  );
};

export default PostItem;