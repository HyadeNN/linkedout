import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/feed/PostList';
import NewPost from '../components/feed/NewPost';
import ProfileView from '../components/profile/ProfileView';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [profileStrength, setProfileStrength] = useState(0);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Get profile data
        const profileData = await profileService.getCurrentUserProfile();
        setProfile(profileData);

        // Get profile strength
        const strengthData = await profileService.getProfileStrength();
        setProfileStrength(strengthData.strength);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        // If profile doesn't exist, we'll show empty state
        if (error.response && error.response.status === 404) {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (selectedTab === 'posts' && user) {
        try {
          setPostsLoading(true);
          const postsData = await postService.getUserPosts(user.id, page);

          if (page === 1) {
            setPosts(postsData.items);
          } else {
            setPosts(prevPosts => [...prevPosts, ...postsData.items]);
          }

          setHasMore(postsData.has_next);
        } catch (error) {
          console.error('Failed to fetch user posts:', error);
        } finally {
          setPostsLoading(false);
        }
      }
    };

    fetchUserPosts();
  }, [user, selectedTab, page]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setPage(1);
    setPosts([]);
    setHasMore(true);
  };

  // Handle new post
  const handleNewPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Handle post update
  const handleUpdatePost = (updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  // Handle post delete
  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !postsLoading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handle edit profile click
  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <ProfileView
        profile={profile}
        user={user}
        isCurrentUser={true}
        profileStrength={profileStrength}
        onEditClick={handleEditProfile}
      />

      <div className="profile-body">
        <div className="profile-section posts-section">
          <div className="section-tabs">
            <button
              className={`tab-btn ${selectedTab === 'posts' ? 'active' : ''}`}
              onClick={() => handleTabChange('posts')}
            >
              Posts
            </button>
            <button
              className={`tab-btn ${selectedTab === 'activity' ? 'active' : ''}`}
              onClick={() => handleTabChange('activity')}
            >
              Activity
            </button>
          </div>

          {selectedTab === 'posts' && (
            <>
              <NewPost onPostCreated={handleNewPost} />

              {postsLoading && posts.length === 0 ? (
                <div className="loading-indicator">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="empty-posts">
                  <p>No posts yet</p>
                  <p>Share your thoughts with your network</p>
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
                      disabled={postsLoading}
                    >
                      {postsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {selectedTab === 'activity' && (
            <div className="activity-content">
              <p>Your recent activity will be shown here.</p>
            </div>
          )}
        </div>

        <div className="profile-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Profile Completion Tips</h3>
            <ul className="completion-tips">
              <li className="tip-item">
                <span className="tip-icon">🖋️</span>
                <span className="tip-text">Add a profile photo to get more connections</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">📝</span>
                <span className="tip-text">Write a summary to tell your story</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">💼</span>
                <span className="tip-text">Add your work experience</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">🎓</span>
                <span className="tip-text">Add your education</span>
              </li>
              <li className="tip-item">
                <span className="tip-icon">🛠️</span>
                <span className="tip-text">Add your skills to show what you know</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Your Dashboard</h3>
            <div className="dashboard-stats">
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Profile views</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Post impressions</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Search appearances</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;