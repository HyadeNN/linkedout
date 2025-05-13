import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import NewPost from './NewPost';
import PostList from './PostList';
import HashtagFilter from './HashtagFilter';
import Header from '../common/Header';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [followedHashtags, setFollowedHashtags] = useState([]);

  useEffect(() => {
    const fetchFollowedHashtags = async () => {
      try {
        const hashtags = await postService.getFollowedHashtags(user.uid);
        setFollowedHashtags(hashtags);
      } catch (error) {
        console.error('Error fetching followed hashtags:', error);
      }
    };

    fetchFollowedHashtags();
  }, [user.uid]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const filters = {};
        if (selectedHashtag) {
          filters.hashtag = selectedHashtag;
        }
        const fetchedPosts = await postService.getPosts(filters);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedHashtag]);

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const handleHashtagClick = (hashtag) => {
    setSelectedHashtag(hashtag === selectedHashtag ? null : hashtag);
  };

  const handleHashtagSelect = (hashtag) => {
    setSelectedHashtag(hashtag === selectedHashtag ? null : hashtag);
  };

  const handleSearchResult = ({ hashtag }) => {
    setSelectedHashtag(hashtag);
  };

  return (
    <>
      <Header onSearchResult={handleSearchResult} />
      <div className="feed">
        <div className="feed-sidebar">
          <HashtagFilter
            onHashtagSelect={handleHashtagSelect}
            selectedHashtag={selectedHashtag}
          />
        </div>

        <div className="feed-main">
          <NewPost onPostCreated={handlePostCreated} />

          {loading ? (
            <div className="loading-indicator">Loading posts...</div>
          ) : (
            <PostList
              posts={posts}
              onUpdatePost={handlePostUpdate}
              onDeletePost={handlePostDelete}
              onHashtagClick={handleHashtagClick}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Feed; 