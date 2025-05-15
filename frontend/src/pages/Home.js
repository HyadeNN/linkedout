import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentForms, setCommentForms] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [visibleCommentSections, setVisibleCommentSections] = useState({});
  const [activeHashtag, setActiveHashtag] = useState(null);

  // URL'den hashtag'i al ve feed'i güncelle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashtagFromUrl = params.get('hashtag');
    
    if (hashtagFromUrl) {
      handleHashtagClick(hashtagFromUrl, false);
    } else {
      fetchPosts();
    }
  }, [location.search]);

  const handleHashtagClick = async (hashtag, updateUrl = true) => {
    try {
      setLoading(true);
      setError('');
      
      // Get posts filtered by hashtag (keep the # if it exists)
      const hashtagPosts = await postService.getPosts({ 
        hashtag: hashtag
      });
      setPosts(hashtagPosts);
      setActiveHashtag(hashtag.replace(/^#/, '')); // Remove # for display

      // URL'i güncelle
      if (updateUrl) {
        const cleanHashtag = hashtag.replace(/^#/, '');
        navigate(`/?hashtag=${encodeURIComponent(cleanHashtag)}`);
      }
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
      setError('An error occurred while loading posts with this hashtag.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
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
      setActiveHashtag(null);
      
      // Ana sayfaya dönüldüğünde URL'i temizle
      if (location.search) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      setError('An error occurred while loading posts.');
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
        [postId]: 'An error occurred while adding the comment.'
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
      setError('An error occurred while deleting the comment.');
    }
  };

  const handlePostCreated = (newPost) => {
    // Add the new post to the beginning of the posts array
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleLikeToggle = async (postId) => {
    if (!user) {
      alert('Please log in to like posts');
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
      alert('An error occurred while toggling the like.');
    }
  };

  const toggleCommentSection = (postId) => {
    setVisibleCommentSections(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <p>No posts yet.</p>
        <button onClick={handlePostCreated}>
          Create the first post
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="feed-container">
        {activeHashtag && (
          <div className="hashtag-header">
            <h2>
              <FaHashtag className="hashtag-icon" />
              {activeHashtag}
            </h2>
            <button className="back-to-feed" onClick={fetchPosts}>
              Back to Feed
            </button>
          </div>
        )}

        <div className="new-post-container">
          <NewPost onPostCreated={handlePostCreated} />
        </div>

        {posts.map(post => {
          const createdAtDate = getValidDate(post.createdAt);
          return (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <Link to={`/users/${post.userId}`} className="post-author">
                  <img
                    src={post.user?.profile?.profile_image || '/default-avatar.jpg'}
                    alt={post.user?.name || 'User'}
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <span className="author-name">{post.user?.name || 'User'}</span>
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
                    <span>{likeCounts[post.id]} likes</span>
                  </div>
                )}
                
                {post.comments_count > 0 && (
                  <button 
                    className="comments-count-btn"
                    onClick={() => toggleCommentSection(post.id)}
                  >
                    <FaComment className="comment-icon" />
                    <span>{post.comments_count} comments</span>
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
                  <span>Like</span>
                </button>

                <button 
                  className="action-btn"
                  onClick={() => toggleCommentSection(post.id)}
                >
                  <FaComment className="action-icon" />
                  <span>Comment</span>
                </button>

                <button
                  className="action-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Post link copied to clipboard!');
                  }}
                >
                  <FaShare className="action-icon" />
                  <span>Share</span>
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
        })}
      </div>
    </div>
  );
};

export default Home;