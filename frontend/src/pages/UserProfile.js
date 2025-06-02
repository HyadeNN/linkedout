import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, profileService, connectionService, postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/feed/PostList';
import ProfileView from '../components/profile/ProfileView';
import ConnectionList from '../components/network/ConnectionList';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [mutualCount, setMutualCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === parseInt(userId);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get user data
        const userData = await userService.getUserById(userId);
        setUser(userData);

        // Get profile data
        const profileData = await profileService.getUserProfile(userId);
        setProfile(profileData);

        if (!isOwnProfile) {
          // Check connection status
          const statusData = await connectionService.checkConnectionStatus(userId);
          setConnectionStatus(statusData);

          // Check if following
          const followingStatus = await connectionService.isFollowingUser(userId);
          setIsFollowing(followingStatus.is_following);

          // Get mutual connections count
          const mutualData = await connectionService.getMutualConnections(userId, 1, 1);
          setMutualCount(mutualData.total);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setError('Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isOwnProfile, currentUser]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (selectedTab === 'posts') {
        try {
          setPostsLoading(true);
          const postsData = await postService.getUserPosts(userId, page);

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
  }, [userId, selectedTab, page]);

  // Handle connect/disconnect
  const handleConnectionAction = async (action) => {
    try {
      setActionLoading(true);

      if (!connectionStatus || connectionStatus.status === 'none') {
        // Send connection request
        await connectionService.createConnectionRequest(userId);
        setConnectionStatus({ status: 'pending', is_sender: true });
      } else if (connectionStatus.status === 'pending' && connectionStatus.is_sender) {
        // Withdraw connection request
        await connectionService.deleteConnection(connectionStatus.connection_id);
        setConnectionStatus({ status: 'none' });
      } else if (connectionStatus.status === 'accepted') {
        // Remove connection
        await connectionService.deleteConnection(connectionStatus.connection_id);
        setConnectionStatus({ status: 'none' });
      } else if (connectionStatus.status === 'pending' && !connectionStatus.is_sender && action) {
        if (action === 'accept') {
          await connectionService.updateConnectionStatus(connectionStatus.connection_id, 'accepted');
          setConnectionStatus({
            ...connectionStatus,
            status: 'accepted'
          });
        } else if (action === 'ignore') {
          await connectionService.deleteConnection(connectionStatus.connection_id);
          setConnectionStatus({ status: 'none' });
        }
      }
    } catch (error) {
      console.error('Failed to perform connection action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowAction = async () => {
    try {
      setActionLoading(true);

      if (isFollowing) {
        await connectionService.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await connectionService.followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to perform follow action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setPage(1);
    setPosts([]);
    setHasMore(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !postsLoading) {
      setPage(prevPage => prevPage + 1);
    }
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

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="error-container">
        <p className="error-message">User not found.</p>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <ProfileView
        profile={profile}
        user={user}
        isCurrentUser={isOwnProfile}
        connectionStatus={connectionStatus}
        onConnectionAction={handleConnectionAction}
      />

      <div className="profile-body">
        <div className="profile-content">
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
                {postsLoading && posts.length === 0 ? (
                  <div className="loading-indicator">Loading posts...</div>
                ) : posts.length === 0 ? (
                  <div className="empty-posts">
                    <p>No posts yet</p>
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
                <p>Recent activity will be shown here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="profile-sidebar">
          {!isOwnProfile && mutualCount > 0 && (
            <div className="sidebar-section mutual-section">
              <ConnectionList
                userId={userId}
                limit={5}
                showViewAll={true}
              />
            </div>
          )}

          {profile.website && (
            <div className="sidebar-section contact-section">
              <h3 className="sidebar-title">Contact</h3>
              <div className="contact-info">
                <p className="website">
                  <span className="contact-label">Website:</span>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="contact-value">
                    {profile.website}
                  </a>
                </p>

                {profile.phone_number && (
                  <p className="phone">
                    <span className="contact-label">Phone:</span>
                    <span className="contact-value">{profile.phone_number}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;