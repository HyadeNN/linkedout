import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services';
import NewPost from '../components/feed/NewPost';
import PostList from '../components/feed/PostList';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getFeedPosts(page);

      if (page === 1) {
        setPosts(response.items);
      } else {
        setPosts(prevPosts => [...prevPosts, ...response.items]);
      }

      setTotalPosts(response.total);
      setHasMore(response.has_next);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleNewPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setTotalPosts(prevCount => prevCount + 1);
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setTotalPosts(prevCount => prevCount - 1);
  };

  return (
    <div className="home-page">
      <div className="feed-container">
        <NewPost onPostCreated={handleNewPost} />

        <div className="feed-filters">
          <div className="filter-tabs">
            <button className="filter-tab active">All Posts</button>
            <button className="filter-tab">Recent</button>
            <button className="filter-tab">Popular</button>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="loading-indicator">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-feed">
            <h3>No posts yet</h3>
            <p>
              Connect with other professionals to see their updates in your feed.
            </p>
            <Link to="/network" className="find-connections-btn">
              Find Connections
            </Link>
          </div>
        ) : (
          <>
            <PostList
              posts={posts}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />

            {hasMore && (
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="home-sidebar">
        <div className="news-card">
          <h3>LinkedOut News</h3>
          <ul className="news-list">
            <li className="news-item">
              <a href="#">
                <h4>Tech layoffs slow down in Q1 2025</h4>
                <p>2h ago • 5,234 readers</p>
              </a>
            </li>
            <li className="news-item">
              <a href="#">
                <h4>Remote work trends shift as offices reopen</h4>
                <p>4h ago • 3,129 readers</p>
              </a>
            </li>
            <li className="news-item">
              <a href="#">
                <h4>Startup funding hits record high in 2024</h4>
                <p>7h ago • 1,892 readers</p>
              </a>
            </li>
            <li className="news-item">
              <a href="#">
                <h4>AI skills dominate job market in 2025</h4>
                <p>1d ago • 7,456 readers</p>
              </a>
            </li>
            <li className="news-item">
              <a href="#">
                <h4>New data privacy regulations take effect</h4>
                <p>1d ago • 2,347 readers</p>
              </a>
            </li>
          </ul>
          <a href="#" className="show-more">Show more</a>
        </div>

        <div className="ad-card">
          <p className="ad-label">Ad</p>
          <div className="ad-content">
            <h4>Upgrade to LinkedOut Premium</h4>
            <p>Get access to premium features and insights</p>
            <button className="premium-btn">Try for free</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;