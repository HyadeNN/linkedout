import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';

const CommentSection = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, [postId, page]);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await postService.getPostComments(postId, page);

      if (page === 1) {
        setComments(response.items);
      } else {
        setComments(prevComments => [...prevComments, ...response.items]);
      }

      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle comment input change
  const handleCommentChange = (e) => {
    setCommentContent(e.target.value);
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (commentContent.trim() === '') {
      return;
    }

    try {
      setSubmitting(true);
      const newComment = await postService.createComment(postId, {
        post_id: postId,
        content: commentContent
      });

      // Add new comment to the list
      setComments(prevComments => [newComment, ...prevComments]);

      // Reset form
      setCommentContent('');

      // Notify parent component
      onCommentAdded();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing a comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // Cancel editing a comment
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Save edited comment
  const handleSaveEdit = async (commentId) => {
    if (editContent.trim() === '') {
      return;
    }

    try {
      setSubmitting(true);
      const updatedComment = await postService.updateComment(commentId, {
        content: editContent
      });

      // Update comment in the list
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? { ...comment, content: updatedComment.content } : comment
        )
      );

      // Reset edit state
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        setSubmitting(true);
        await postService.deleteComment(commentId);

        // Remove comment from the list
        setComments(prevComments =>
          prevComments.filter(comment => comment.id !== commentId)
        );

        // Notify parent component
        onCommentDeleted();
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Load more comments
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-form">
        <img
          src={user?.profile?.profile_image || '/default-avatar.jpg'}
          alt={`${user?.first_name} ${user?.last_name}`}
          className="commenter-avatar"
        />
        <form onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentContent}
            onChange={handleCommentChange}
            className="comment-input"
            disabled={submitting}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={submitting || commentContent.trim() === ''}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>

      <div className="comments-list">
        {loading && comments.length === 0 ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first to comment!</div>
        ) : (
          <>
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <Link to={`/users/${comment.author_id}`} className="comment-author">
                  <img
                    src={comment.author?.profile?.profile_image || '/default-avatar.jpg'}
                    alt={`${comment.author?.first_name} ${comment.author?.last_name}`}
                    className="comment-avatar"
                  />
                </Link>

                <div className="comment-content">
                  <div className="comment-header">
                    <Link to={`/users/${comment.author_id}`} className="comment-author-name">
                      {comment.author?.first_name} {comment.author?.last_name}
                    </Link>
                    <span className="comment-time">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="comment-edit-form">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="edit-comment-input"
                        disabled={submitting}
                        autoFocus
                      />
                      <div className="edit-comment-actions">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="cancel-edit-btn"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="save-edit-btn"
                          disabled={submitting || editContent.trim() === ''}
                        >
                          {submitting ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{comment.content}</p>
                  )}

                  <div className="comment-actions">
                    <button className="comment-action-btn">Like</button>
                    <button className="comment-action-btn">Reply</button>

                    {comment.author_id === user?.id && (
                      <>
                        <button
                          className="comment-action-btn"
                          onClick={() => handleEditComment(comment)}
                          disabled={submitting}
                        >
                          Edit
                        </button>
                        <button
                          className="comment-action-btn delete"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={submitting}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                className="load-more-comments-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Comments'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;