import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, profileService, connectionService, postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/feed/PostList';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [mutualConnections, setMutualConnections] = useState([]);
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

          // Get mutual connections
          const mutualData = await connectionService.getMutualConnections(userId);
          setMutualConnections(mutualData.items);
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
  }, [userId, isOwnProfile]);

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
  const handleConnectionAction = async () => {
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

  // Handle accept/reject connection request
  const handleConnectionResponse = async (accept) => {
    try {
      setActionLoading(true);

      if (connectionStatus.status === 'pending' && !connectionStatus.is_sender) {
        await connectionService.updateConnectionStatus(
          connectionStatus.connection_id,
          accept ? 'accepted' : 'rejected'
        );

        setConnectionStatus({
          ...connectionStatus,
          status: accept ? 'accepted' : 'none'
        });
      }
    } catch (error) {
      console.error('Failed to respond to connection request:', error);
      alert('Failed to respond to connection request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !postsLoading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setPage(1);
    setPosts([]);
    setHasMore(true);
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
      <div className="profile-header">
        <div className="profile-cover">
          <img
            src={profile.cover_image || '/default-cover.jpg'}
            alt="Cover"
            className="cover-image"
          />
        </div>

        <div className="profile-info">
          <div className="profile-photo">
            <img
              src={profile.profile_image || '/default-avatar.jpg'}
              alt={`${user.first_name} ${user.last_name}`}
              className="photo"
            />
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{user.first_name} {user.last_name}</h1>
            <p className="profile-headline">{profile.headline || 'No headline'}</p>
            <p className="profile-location">{profile.location || 'No location'}</p>

            {!isOwnProfile && mutualCount > 0 && (
              <p className="mutual-connections">
                {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <Link to="/profile/edit" className="edit-profile-btn">
                Edit Profile
              </Link>
            ) : (
              <>
                {connectionStatus && connectionStatus.status === 'pending' && !connectionStatus.is_sender ? (
                  <div className="connection-response-buttons">
                    <button
                      className="accept-btn"
                      onClick={() => handleConnectionResponse(true)}
                      disabled={actionLoading}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleConnectionResponse(false)}
                      disabled={actionLoading}
                    >
                      Ignore
                    </button>
                  </div>
                ) : (
                  <button
                    className={`connect-btn ${connectionStatus && connectionStatus.status !== 'none' ? 'connected' : ''}`}
                    onClick={handleConnectionAction}
                    disabled={actionLoading}
                  >
                    {!connectionStatus || connectionStatus.status === 'none'
                      ? 'Connect'
                      : connectionStatus.status === 'pending' && connectionStatus.is_sender
                      ? 'Pending'
                      : 'Connected'}
                  </button>
                )}

                <button
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollowAction}
                  disabled={actionLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                <button className="message-btn" disabled={actionLoading}>
                  Message
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-content">
          <div className="profile-section about-section">
            <h2 className="section-title">About</h2>
            <p className="about-text">
              {profile.about || 'No information provided.'}
            </p>
          </div>

          {profile.experiences && profile.experiences.length > 0 && (
            <div className="profile-section experience-section">
              <h2 className="section-title">Experience</h2>
              <div className="experience-list">
                {profile.experiences.map(experience => (
                  <div key={experience.id} className="experience-item">
                    <div className="experience-logo">
                      <div className="company-logo-placeholder"></div>
                    </div>
                    <div className="experience-details">
                      <h3 className="experience-title">{experience.title}</h3>
                      <p className="experience-company">{experience.company}</p>
                      <p className="experience-date">
                        {new Date(experience.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -
                        {experience.is_current
                          ? ' Present'
                          : experience.end_date ? ` ${new Date(experience.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                      </p>
                      <p className="experience-location">{experience.location}</p>
                      {experience.description && (
                        <p className="experience-description">{experience.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.educations && profile.educations.length > 0 && (
            <div className="profile-section education-section">
              <h2 className="section-title">Education</h2>
              <div className="education-list">
                {profile.educations.map(education => (
                  <div key={education.id} className="education-item">
                    <div className="education-logo">
                      <div className="school-logo-placeholder"></div>
                    </div>
                    <div className="education-details">
                      <h3 className="education-school">{education.school}</h3>
                      <p className="education-degree">
                        {education.degree}{education.field_of_study ? `, ${education.field_of_study}` : ''}
                      </p>
                      <p className="education-date">
                        {new Date(education.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -
                        {education.is_current
                          ? ' Present'
                          : education.end_date ? ` ${new Date(education.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                      </p>
                      {education.description && (
                        <p className="education-description">{education.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="profile-section skills-section">
              <h2 className="section-title">Skills</h2>
              <div className="skills-list">
                {profile.skills.map(skill => (
                  <div key={skill.id} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    {skill.endorsement_count > 0 && (
                      <span className="endorsement-count">{skill.endorsement_count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {!isOwnProfile && mutualConnections.length > 0 && (
            <div className="sidebar-section mutual-section">
              <h3 className="sidebar-title">Mutual Connections</h3>
              <div className="mutual-list">
                {mutualConnections.map(mutual => (
                  <Link key={mutual.id} to={`/users/${mutual.id}`} className="mutual-item">
                    <img
                      src={mutual.profile?.profile_image || '/default-avatar.jpg'}
                      alt={`${mutual.first_name} ${mutual.last_name}`}
                      className="mutual-avatar"
                    />
                    <span className="mutual-name">{mutual.first_name} {mutual.last_name}</span>
                  </Link>
                ))}

                {mutualCount > mutualConnections.length && (
                  <Link to={`/connections/mutual/${userId}`} className="view-all-link">
                    View all {mutualCount} mutual connections
                  </Link>
                )}
              </div>
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