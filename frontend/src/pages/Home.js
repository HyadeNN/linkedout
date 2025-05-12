import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services';
import CommentSection from '../components/feed/CommentSection';
import './Home.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Yardımcı fonksiyon: Firestore Timestamp, string veya number'ı Date'e çevir
function getValidDate(date) {
  if (!date) return null;
  if (typeof date.toDate === 'function') return date.toDate();
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentForms, setCommentForms] = useState({});
  const [commentErrors, setCommentErrors] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.getFeedPosts();
      // Fetch author info for each post if not present
      const postsWithAuthors = await Promise.all(
        data.map(async post => {
          if (!post.author) {
            try {
              const userDoc = await getDoc(doc(db, 'users', post.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...post,
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
            } catch (e) {}
          }
          return post;
        })
      );
      setPosts(postsWithAuthors || []);
    } catch (error) {
      setError('Gönderiler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentForms(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleAddComment = async (postId) => {
    const content = commentForms[postId];
    if (!content?.trim()) return;

    try {
      setCommentErrors(prev => ({ ...prev, [postId]: '' }));
      const newComment = await postService.createComment(postId, {
        content: content.trim()
      });

      // Update posts to include the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments: [...(post.comments || []), newComment] }
            : post
        )
      );

      // Clear comment form
      setCommentForms(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      setCommentErrors(prev => ({
        ...prev,
        [postId]: 'Yorum eklenirken bir hata oluştu.'
      }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await postService.deleteComment(commentId);
      
      // Update posts to remove the deleted comment
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter(comment => comment.id !== commentId)
              }
            : post
        )
      );
    } catch (error) {
      setError('Yorum silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return <div className="loading">Gönderiler yükleniyor...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-page">
      <div className="feed-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>Henüz hiç gönderi yok.</p>
            <Link to="/profile" className="create-post-link">
              İlk gönderiyi paylaş
            </Link>
          </div>
        ) : (
          posts.map(post => {
            const createdAtDate = getValidDate(post.createdAt);
            return (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <Link to={`/users/${post.userId}`} className="post-author">
                    <img
                      src={post.author?.profile?.profile_image || '/default-avatar.jpg'}
                      alt={`${post.author?.first_name || ''} ${post.author?.last_name || ''}`}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <span className="author-name">
                        {post.author?.first_name} {post.author?.last_name}
                      </span>
                      <span className="post-date">
                        {createdAtDate ? formatDistanceToNow(createdAtDate, { addSuffix: true }) : ''}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="post-content">
                  <p className="post-text">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" className="post-image" />
                  )}
                </div>

                <CommentSection
                  postId={post.id}
                  onCommentAdded={() => fetchPosts()}
                  onCommentDeleted={() => fetchPosts()}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;