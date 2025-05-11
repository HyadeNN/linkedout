import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService, postService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import PostList from '../components/feed/PostList';
import NewPost from '../components/feed/NewPost';

const Profile = () => {
  const { user } = useAuth();
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

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover">
          <img
            src={profile?.cover_image || '/default-cover.jpg'}
            alt="Cover"
            className="cover-image"
          />
          <button className="edit-cover-btn">
            <span className="edit-icon">📷</span>
            Edit cover
          </button>
        </div>

        <div className="profile-info">
          <div className="profile-photo">
            <img
              src={profile?.profile_image || '/default-avatar.jpg'}
              alt={`${user?.first_name} ${user?.last_name}`}
              className="photo"
            />
            <button className="edit-photo-btn">
              <span className="edit-icon">📷</span>
            </button>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{user?.first_name} {user?.last_name}</h1>
            <p className="profile-headline">{profile?.headline || 'No headline'}</p>
            <p className="profile-location">{profile?.location || 'No location'}</p>
          </div>

          <div className="profile-actions">
            <Link to="/profile/edit" className="edit-profile-btn">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {profileStrength < 100 && (
        <div className="profile-strength-bar">
          <div className="strength-info">
            <h3>Profile Strength: {profileStrength}%</h3>
            <p>Complete your profile to stand out to recruiters</p>
          </div>
          <div className="strength-progress">
            <div
              className="progress-bar"
              style={{ width: `${profileStrength}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="profile-body">
        <div className="profile-content">
          {profile ? (
            <>
              <div className="profile-section about-section">
                <h2 className="section-title">About</h2>
                <p className="about-text">
                  {profile.about || 'No information provided.'}
                </p>
                {!profile.about && (
                  <Link to="/profile/edit" className="add-about-btn">
                    Add about
                  </Link>
                )}
              </div>

              <div className="profile-section experience-section">
                <div className="section-header">
                  <h2 className="section-title">Experience</h2>
                  <button className="add-item-btn">
                    <span className="add-icon">+</span>
                  </button>
                </div>

                {profile.experiences && profile.experiences.length > 0 ? (
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
                        <div className="item-actions">
                          <button className="edit-item-btn">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-section">
                    <p>Add your work experience</p>
                    <button className="add-experience-btn">Add experience</button>
                  </div>
                )}
              </div>

              <div className="profile-section education-section">
                <div className="section-header">
                  <h2 className="section-title">Education</h2>
                  <button className="add-item-btn">
                    <span className="add-icon">+</span>
                  </button>
                </div>

                {profile.educations && profile.educations.length > 0 ? (
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
                        <div className="item-actions">
                          <button className="edit-item-btn">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-section">
                    <p>Add your education</p>
                    <button className="add-education-btn">Add education</button>
                  </div>
                )}
              </div>

              <div className="profile-section skills-section">
                <div className="section-header">
                  <h2 className="section-title">Skills</h2>
                  <button className="add-item-btn">
                    <span className="add-icon">+</span>
                  </button>
                </div>

                {profile.skills && profile.skills.length > 0 ? (
                  <div className="skills-list">
                    {profile.skills.map(skill => (
                      <div key={skill.id} className="skill-item">
                        <span className="skill-name">{skill.name}</span>
                        {skill.endorsement_count > 0 && (
                          <span className="endorsement-count">{skill.endorsement_count} endorsements</span>
                        )}
                        <div className="item-actions">
                          <button className="edit-item-btn">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-section">
                    <p>Add your skills</p>
                    <button className="add-skill-btn">Add skill</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="create-profile-section">
              <h2>Create Your Profile</h2>
              <p>Showcase your skills and experience to stand out to recruiters and connections.</p>
              <Link to="/profile/edit" className="create-profile-btn">
                Create Profile
              </Link>
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