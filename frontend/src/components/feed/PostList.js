import React from 'react';
import PostItem from './PostItem';

const PostList = ({ posts = [], loading = false, onUpdatePost, onDeletePost, isOwnProfile = false, showUser = true }) => {
  if (loading) {
    return <div className="posts-loading">Loading posts...</div>;
  }
  
  // Ensure posts is an array
  const postsArray = Array.isArray(posts) ? posts : [];
  
  if (postsArray.length === 0) {
    return (
      <div className="empty-post-list">
        <div className="empty-post-icon"></div>
        <p>No posts available</p>
      </div>
    );
  }
  
  return (
    <div className="post-list">
      {postsArray.map(post => (
        <PostItem
          key={post.id || Math.random().toString(36).substr(2, 9)}
          post={post}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
          isOwnProfile={isOwnProfile}
          showUser={showUser}
        />
      ))}
    </div>
  );
};

export default PostList;