import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './CommentSection.css';

const CommentSection = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Fetch current user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUserProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle Firestore Timestamp
    if (timestamp?.seconds) {
      return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true });
    }
    
    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    }
    
    // Handle string date
    if (typeof timestamp === 'string') {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    }

    return '';
  };

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await postService.getComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setError('Failed to load comments. Please try again.');
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
      const newComment = await postService.createComment(postId, user.uid, commentContent);
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentContent('');
      onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Handle save edit
  const handleSaveEdit = async (commentId) => {
    if (editContent.trim() === '') {
      return;
    }

    try {
      setSubmitting(true);
      const updatedComment = await postService.updateComment(postId, commentId, {
        content: editContent
      });

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId 
            ? { 
                ...comment, 
                content: editContent,
                updatedAt: updatedComment.updatedAt
              } 
            : comment
        )
      );

      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      setError('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setSubmitting(true);
      await postService.deleteComment(postId, commentId);
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      onCommentDeleted();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setError('Failed to delete comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading comments...</div>;
  }

  return (
    <div className="comment-section">
      {error && <div className="error-message">{error}</div>}

      <div className="comment-form">
        <img
          src={currentUserProfile?.profile?.profile_image || currentUserProfile?.profile_image || '/default-avatar.jpg'}
          alt={`${currentUserProfile?.name || 'User'}`}
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
        {comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <Link to={`/users/${comment.author?.id}`}>
                <img
                  src={comment.author?.profile?.profile_image || '/default-avatar.jpg'}
                  alt={`${comment.author?.first_name}`}
                  className="comment-avatar"
                />
              </Link>

              <div className="comment-content">
                <div className="comment-header">
                  <Link to={`/users/${comment.author?.id}`} className="comment-author-name">
                    {comment.author?.first_name}
                  </Link>
                  <span className="comment-time">
                    {formatTimestamp(comment.createdAt)}
                    {comment.updatedAt && ' (edited)'}
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
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-text">{comment.content}</p>
                    {comment.userId === user?.uid && (
                      <div className="comment-actions">
                        <button
                          type="button"
                          onClick={() => handleEditComment(comment)}
                          className="comment-action-btn"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="comment-action-btn"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;