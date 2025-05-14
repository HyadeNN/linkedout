import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services';
import CommentSection from '../components/feed/CommentSection';
import NewPost from '../components/feed/NewPost';
import './Home.css';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { FaThumbsUp, FaRegThumbsUp, FaComment, FaShare, FaHashtag } from 'react-icons/fa';

// Yardımcı fonksiyon: Firestore Timestamp, string veya number'ı Date'e çevir
function getValidDate(date) {
  if (!date) return null;
  if (typeof date.toDate === 'function') return date.toDate();
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentForms, setCommentForms] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [visibleCommentSections, setVisibleCommentSections] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleHashtagClick = async (hashtag) => {
    try {
      setLoading(true);
      setError('');
      // Remove the # symbol if present
      const tag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
      
      // Get posts filtered by hashtag
      const hashtagPosts = await postService.getPosts({ hashtag: tag });
      setPosts(hashtagPosts);
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
      setError('Hashtag ile ilgili gönderiler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.getFeedPosts();
      const postsWithAuthors = await Promise.all(
        data.map(async post => {
          try {
            const userDoc = await getDoc(doc(db, 'users', post.userId));
            const postDoc = await getDoc(doc(db, 'posts', post.id));
            
            if (userDoc.exists() && postDoc.exists()) {
              const userData = userDoc.data();
              const postData = postDoc.data();
              const likes = postData.likes || [];
              
              setLikedPosts(prev => ({
                ...prev,
                [post.id]: likes.includes(user?.uid)
              }));
              
              setLikeCounts(prev => ({
                ...prev,
                [post.id]: likes.length
              }));

              return {
                ...post,
                likes: likes,
                hashtags: postData.hashtags || [],
                user: {
                  name: userData.name || '',
                  profile: {
                    profile_image: userData.profile?.profile_image || userData.profile_image || '',
                    headline: userData.headline || ''
                  }
                }
              };
            }
          } catch (e) {
            console.error('Error fetching post data:', e);
          }
          return post;
        })
      );
      setPosts(postsWithAuthors.filter(Boolean));
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

  const handlePostCreated = (newPost) => {
    // Add the new post to the beginning of the posts array
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleLikeToggle = async (postId) => {
    if (!user) {
      alert('Beğenmek için giriş yapmalısınız');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const isLiked = likedPosts[postId];

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
        setLikeCounts(prev => ({ ...prev, [postId]: prev[postId] - 1 }));
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        setLikeCounts(prev => ({ ...prev, [postId]: prev[postId] + 1 }));
      }
    } catch (error) {
      console.error('Beğeni işlemi başarısız oldu:', error);
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const toggleCommentSection = (postId) => {
    setVisibleCommentSections(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
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
        <div className="new-post-container">
          <NewPost onPostCreated={handlePostCreated} />
        </div>

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
                      src={post.user?.profile?.profile_image || '/default-avatar.jpg'}
                      alt={post.user?.name || 'Kullanıcı'}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <span className="author-name">{post.user?.name || 'Kullanıcı'}</span>
                      <span className="author-headline">{post.user?.profile?.headline || ''}</span>
                      <span className="post-date">
                        {createdAtDate ? formatDistanceToNow(createdAtDate, { addSuffix: true }) : ''}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="post-content">
                  <p className="post-text">{post.content}</p>
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="post-hashtags">
                      {post.hashtags.map((hashtag, index) => (
                        <button
                          key={index}
                          className="hashtag-button"
                          onClick={() => handleHashtagClick(hashtag)}
                        >
                          <FaHashtag className="hashtag-icon" />
                          {hashtag.replace(/^#/, '')}
                        </button>
                      ))}
                    </div>
                  )}

                  {post.imageUrl && (
                    <div className="post-image-container">
                      <img src={post.imageUrl} alt="Post" className="post-image" />
                    </div>
                  )}
                </div>

                <div className="post-stats">
                  {likeCounts[post.id] > 0 && (
                    <div className="likes-count">
                      <FaThumbsUp className="like-icon" style={{ color: '#0073b1' }} />
                      <span>{likeCounts[post.id]} beğeni</span>
                    </div>
                  )}
                  
                  {post.comments_count > 0 && (
                    <button 
                      className="comments-count-btn"
                      onClick={() => toggleCommentSection(post.id)}
                    >
                      <FaComment className="comment-icon" />
                      <span>{post.comments_count} yorum</span>
                    </button>
                  )}
                </div>

                <div className="post-actions">
                  <button
                    className={`action-btn ${likedPosts[post.id] ? 'liked' : ''}`}
                    onClick={() => handleLikeToggle(post.id)}
                  >
                    {likedPosts[post.id] ? (
                      <FaThumbsUp className="action-icon" />
                    ) : (
                      <FaRegThumbsUp className="action-icon" />
                    )}
                    <span>Beğen</span>
                  </button>

                  <button 
                    className="action-btn"
                    onClick={() => toggleCommentSection(post.id)}
                  >
                    <FaComment className="action-icon" />
                    <span>Yorum Yap</span>
                  </button>

                  <button
                    className="action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Gönderi bağlantısı panoya kopyalandı!');
                    }}
                  >
                    <FaShare className="action-icon" />
                    <span>Paylaş</span>
                  </button>
                </div>

                {visibleCommentSections[post.id] && (
                  <CommentSection
                    postId={post.id}
                    onCommentAdded={fetchPosts}
                    onCommentDeleted={fetchPosts}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;