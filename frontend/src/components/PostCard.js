import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { FaThumbsUp, FaRegThumbsUp, FaComment, FaShare, FaHashtag } from 'react-icons/fa';
import './PostCard.css';

const PostCard = ({ post, onUpdatePost }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user || !post.id) return;
      
      try {
        const postDoc = await getDoc(doc(db, 'posts', post.id));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          const likes = postData.likes || [];
          setIsLiked(likes.includes(user.uid));
          setLikesCount(likes.length);
        }
      } catch (error) {
        console.error('Failed to check if post is liked:', error);
      }
    };

    checkIfLiked();
  }, [post.id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      alert('You need to login to like this post');
      return;
    }

    try {
      setLoading(true);
      const postRef = doc(db, 'posts', post.id);
      
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }

      if (onUpdatePost) {
        onUpdatePost({
          ...post,
          likes_count: isLiked ? likesCount - 1 : likesCount + 1
        });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('Like operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag) => {
    // Actions when a hashtag is clicked
    console.log('Hashtag clicked:', hashtag);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <a className="post-author" href={`/users/${post.userId}`}>
          <img 
            src={post.user?.profile?.profile_image || '/default-avatar.jpg'} 
            alt={post.user?.name || 'User'} 
            className="author-avatar"
          />
          <div className="author-info">
            <span className="author-name">{post.user?.name || 'User'}</span>
            <span className="author-headline">{post.user?.headline || ''}</span>
            <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </a>
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
        {likesCount > 0 && (
          <div className="likes-count">
            <FaThumbsUp className="like-icon" style={{ color: '#0073b1' }} />
            <span>{likesCount} likes</span>
          </div>
        )}
        
        {post.comments_count > 0 && (
          <div className="comments-count">
            <FaComment className="comment-icon" />
            <span>{post.comments_count} comments</span>
          </div>
        )}
      </div>

      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLikeToggle}
          disabled={loading}
        >
          {isLiked ? (
            <FaThumbsUp className="action-icon" />
          ) : (
            <FaRegThumbsUp className="action-icon" />
          )}
          <span>Like</span>
        </button>

        <button className="action-btn">
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

      {post.comment_section && (
        <div className="comment-section">
          {post.comment_section}
        </div>
      )}
    </div>
  );
};

export default PostCard; 