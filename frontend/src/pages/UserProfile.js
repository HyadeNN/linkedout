import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, profileService, connectionService, postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/feed/PostList';
import { getUserById } from '../services/user';

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
  const [error, setError] = useState('');
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
        setError('');
        const userData = await getUserById(userId);
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
      } catch (err) {
        setError('Kullanıcı bulunamadı veya yüklenemedi.');
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

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return null;

  return (
    <div className="user-profile-figma-bg">
      <div className="top-bar">
        <h1>User Profile</h1>
      </div>
      <div className="user-profile-figma-container">
        {/* Profile Main Card */}
        <div className="profile-main-card profile-header-modern">
          <div className="profile-cover-figma cover-image-modern">
            <img src={user.profile?.cover_image || "/default-cover.jpg"} alt="Cover" />
          </div>
          <div className="profile-photo-figma profile-picture-modern">
            <img src={user.profile?.profile_image || "/default-avatar.jpg"} alt={user.profile?.first_name || user.first_name} />
          </div>
          <div className="profile-info-figma profile-info-modern">
            <div className="profile-name-row name-section-modern">
              <span className="profile-name-figma profile-name-modern">
                {user.profile?.first_name || user.first_name} {user.profile?.last_name || user.last_name}
              </span>
            </div>
            {profile?.headline && <div className="profile-headline-figma profile-headline-modern">{profile.headline}</div>}
            {profile?.location && <div className="profile-location-figma location-modern">{profile.location}</div>}
            {profile?.bio && <div className="profile-bio-figma bio-input-modern">{profile.bio}</div>}
            <div className="profile-actions-modern" style={{ marginTop: 18 }}>
              <button className="action-button-modern secondary">
                {profile?.email || user?.email || 'Contact info'}
              </button>
              <button className="action-button-modern secondary">
                {typeof mutualCount === 'number' ? `${mutualCount} connections` : 'Connections'}
              </button>
            </div>
          </div>
          {/* Tab Bar */}
          <div className="profile-tabs-bar">
            <button className="profile-tab active">Profile</button>
            <button className="profile-tab">Activity & Interests</button>
            <button className="profile-tab">Articles</button>
          </div>
        </div>
        {/* About Card */}
        <div className="profile-wide-card">
          <h2 className="section-title">About</h2>
          <p className="about-text">
            {profile?.about ? profile.about : 'No information provided.'}
          </p>
        </div>
        {/* Posts Card */}
        <div className="profile-wide-card">
          <h2 className="section-title">Posts</h2>
          <div>
            <PostList
              posts={posts}
              loading={postsLoading}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              isOwnProfile={isOwnProfile}
              showUser={false}
            />
            {!postsLoading && posts.length === 0 && (
              <div className="empty-section">No post added yet.</div>
            )}
            {posts.length > 0 && hasMore && !postsLoading && (
              <button className="load-more-btn" onClick={handleLoadMore}>
                Load More
              </button>
            )}
          </div>
        </div>
        {/* Experience Card */}
        <div className="profile-wide-card">
          <h2 className="section-title">Experience</h2>
          {profile?.experiences && profile.experiences.length > 0 ? (
            <div className="experience-list">
              {profile.experiences.map(exp => (
                <div key={exp.id} className="experience-mini-card">
                  <div className="experience-logo">
                    <div className="company-logo-placeholder"></div>
                  </div>
                  <div className="experience-details">
                    <h3 className="experience-title">{exp.title}</h3>
                    <p className="experience-company">{exp.company}</p>
                    <p className="experience-date">
                      {new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -
                      {exp.is_current ? ' Present' : exp.end_date ? ` ${new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                    </p>
                    <p className="experience-location">{exp.location}</p>
                    {exp.description && <p className="experience-description">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-section">No experience added yet.</p>
          )}
        </div>
        {/* Education Card */}
        <div className="profile-wide-card">
          <h2 className="section-title">Education</h2>
          {profile?.educations && profile.educations.length > 0 ? (
            <div className="education-list">
              {profile.educations.map(edu => (
                <div key={edu.id} className="education-mini-card">
                  <div className="education-logo">
                    <div className="school-logo-placeholder"></div>
                  </div>
                  <div className="education-details">
                    <h3 className="education-school">{edu.school}</h3>
                    <p className="education-degree">{edu.degree}{edu.field_of_study ? `, ${edu.field_of_study}` : ''}</p>
                    <p className="education-date">
                      {new Date(edu.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -
                      {edu.is_current ? ' Present' : edu.end_date ? ` ${new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                    </p>
                    {edu.description && <p className="education-description">{edu.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-section">No education added yet.</p>
          )}
        </div>
        {/* Skills Card */}
        <div className="profile-wide-card">
          <h2 className="section-title">Skills</h2>
          {profile?.skills && profile.skills.length > 0 ? (
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
          ) : (
            <p className="empty-section">No skills added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;