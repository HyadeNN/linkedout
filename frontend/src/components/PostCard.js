import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import './PostCard.css';

const PostCard = ({ post, onUpdatePost }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        if (user) {
          const liked = await postService.isPostLiked(post.id, user.uid);
          setIsLiked(liked);
        }
      } catch (error) {
        console.error('Failed to check if post is liked:', error);
      }
    };

    const getLikesCount = async () => {
      try {
        const count = await postService.getPostLikesCount(post.id);
        setLikesCount(count);
      } catch (error) {
        console.error('Failed to get likes count:', error);
      }
    };

    checkIfLiked();
    getLikesCount();
  }, [post.id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      // Handle not logged in case
      alert('Please log in to like posts');
      return;
    }

    try {
      setLoading(true);
      
      if (isLiked) {
        await postService.unlikePost(post.id, user.uid);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await postService.likePost(post.id, user.uid);
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
      alert('Failed to update like. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag) => {
    // You can implement hashtag filtering here
    console.log('Hashtag clicked:', hashtag);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <a className="post-author" href={`/users/${post.userId}`}>
          <img 
            src={post.author?.profileImage || '/default-avatar.jpg'} 
            alt={post.author?.name || 'User'} 
            className="author-avatar"
          />
          <div className="author-info">
            <span className="author-name">{post.author?.name || 'User'}</span>
            <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </a>
      </div>

      <div className="post-content">
        <p className="post-text">{post.content}</p>
        {post.imageUrl && (
          <div className="post-image-container">
            <img src={post.imageUrl} alt="Post" className="post-image" />
          </div>
        )}
        
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="post-hashtags">
            {post.hashtags.map((hashtag, index) => (
              <button
                key={index}
                className="post-hashtag"
                onClick={() => handleHashtagClick(hashtag)}
              >
                {hashtag}
              </button>
            ))}
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
        
        {post.comments_count > 0 && (
          <div className="comments-count">
            {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
          </div>
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

        <button className="action-btn">
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
    </div>
  );
};

export default PostCard; 