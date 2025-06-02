import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/feed/CommentSection';

const SinglePost = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await postService.getPost(postId);
        setPost(postData);
        setLikesCount(postData.likes_count || 0);
        setCommentsCount(postData.comments_count || 0);

        // Check if the post is liked by the current user
        const isPostLiked = await postService.isPostLiked(postId);
        setIsLiked(isPostLiked);
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Toggle options menu
  const toggleOptions = () => {
    setShowOptions(prevState => !prevState);
  };

  // Handle edit mode
  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditing(true);
    setShowOptions(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (editContent.trim() === '') {
      return;
    }

    try {
      setActionLoading(true);
      const updatedPost = await postService.updatePost(post.id, editContent);
      setPost(prevPost => ({ ...prevPost, content: updatedPost.content, updated_at: updatedPost.updated_at }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setActionLoading(true);
        await postService.deletePost(post.id);
        navigate('/');
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Toggle like
  const handleLikeToggle = async () => {
    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  // Handle comment added
  const handleCommentAdded = () => {
    setCommentsCount(prevCount => prevCount + 1);
  };

  // Handle comment deleted
  const handleCommentDeleted = () => {
    setCommentsCount(prevCount => Math.max(0, prevCount - 1));
  };

  if (loading) {
    return <div className="loading-indicator">Loading post...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-container">
        <p className="error-message">Post not found.</p>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="single-post-page">
      <div className="post-container">
        <div className="post-card">
          <div className="post-header">
            <Link to={`/users/${post.author_id}`} className="post-author">
              <img
                src={post.author?.profile?.profile_image || '/default-avatar.jpg'}
                alt={`${post.author?.first_name} ${post.author?.last_name}`}
                className="author-avatar"
              />
              <div className="author-info">
                <h3 className="author-name">
                  {post.author?.first_name} {post.author?.last_name}
                </h3>
                <p className="author-headline">{post.author?.profile?.headline || ''}</p>
                <span className="post-time">
                  {new Date(post.created_at).toLocaleString()}
                  {post.updated_at && post.updated_at !== post.created_at && ' (edited)'}
                </span>
              </div>
            </Link>

            {post.author_id === user?.id && (
              <div className="post-options">
                <button
                  className="options-btn"
                  onClick={toggleOptions}
                  disabled={actionLoading}
                >
                  <span className="options-icon">⋯</span>
                </button>

                {showOptions && (
                  <div className="options-menu">
                    <button
                      className="option-item"
                      onClick={handleEdit}
                      disabled={actionLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="option-item delete"
                      onClick={handleDelete}
                      disabled={actionLoading}
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
                  disabled={actionLoading}
                  autoFocus
                />
                <div className="edit-actions">
                  <button
                    className="cancel-edit-btn"
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-edit-btn"
                    onClick={handleSaveEdit}
                    disabled={actionLoading || editContent.trim() === ''}
                  >
                    {actionLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="post-text">{post.content}</p>
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
              <div className="comments-count">
                {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="post-actions">
            <button
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLikeToggle}
              disabled={actionLoading}
            >
              <span className="action-icon">👍</span>
              <span className="action-label">{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            <button
              className="action-btn"
              disabled={actionLoading}
            >
              <span className="action-icon">💬</span>
              <span className="action-label">Comment</span>
            </button>

            <button
              className="action-btn"
              disabled={actionLoading}
            >
              <span className="action-icon">↗️</span>
              <span className="action-label">Share</span>
            </button>
          </div>

          <CommentSection
            postId={post.id}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
          />
        </div>
      </div>
    </div>
  );
};

export default SinglePost;