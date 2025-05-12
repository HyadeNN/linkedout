import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import './CommentSection.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

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
  const [error, setError] = useState('');

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, [postId, page]);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const comments = await postService.getComments(postId);
      // Fetch author info for each comment
      const commentsWithAuthors = await Promise.all(
        comments.map(async comment => {
          const userDoc = await getDoc(doc(db, 'users', comment.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              ...comment,
              author: {
                first_name: userData.name || '',
                last_name: '',
                profile: {
                  profile_image: userData.profile?.profile_image || userData.profile_image || '',
                  headline: userData.headline || ''
                }
              }
            };
          }
          return comment;
        })
      );
      setComments(commentsWithAuthors);
      setHasMore(false);
    } catch (error) {
      setError('Yorumlar yüklenemedi.');
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
      const newCommentId = await postService.createComment(postId, user.uid, commentContent);
      // Fetch the new comment with author info
      const commentDoc = await getDoc(doc(db, 'comments', newCommentId));
      let newComment = { id: commentDoc.id, ...commentDoc.data() };
      // Fetch author profile
      const userDoc = await getDoc(doc(db, 'users', newComment.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        newComment.author = {
          first_name: userData.name || '',
          last_name: '',
          profile: {
            profile_image: userData.profile?.profile_image || userData.profile_image || '',
            headline: userData.headline || ''
          }
        };
      }
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentContent('');
      onCommentAdded();
    } catch (error) {
      setError('Yorum eklenemedi.');
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
      setError('Yorum güncellenemedi.');
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
        setError('Yorum silinemedi.');
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

  if (loading) {
    return <div className="loading">Yorumlar yükleniyor...</div>;
  }

  return (
    <div className="comment-section">
      {error && <div className="error-message">{error}</div>}

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
        {comments.length === 0 ? (
          <div className="comments-empty">Henüz yorum yapılmamış.</div>
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