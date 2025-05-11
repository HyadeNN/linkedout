import React from 'react';
import PostItem from './PostItem';

const PostList = ({ posts, onUpdatePost, onDeletePost }) => {
  return (
    <div className="post-list">
      {posts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
        />
      ))}
    </div>
  );
};

export default PostList;