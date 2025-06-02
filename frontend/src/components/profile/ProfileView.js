import React from 'react';
import { Link } from 'react-router-dom';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';

const ProfileView = ({
  profile,
  user,
  isCurrentUser = false,
  profileStrength = 0,
  onEditClick,
  onConnectionAction,
  connectionStatus = null
}) => {
  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    }
  };

  const handleConnectionAction = () => {
    if (onConnectionAction) {
      onConnectionAction();
    }
  };

  const renderConnectionButton = () => {
    if (isCurrentUser) return null;

    if (!connectionStatus) {
      return (
        <button
          className="connect-btn"
          onClick={handleConnectionAction}
        >
          Connect
        </button>
      );
    }

    if (connectionStatus.status === 'pending') {
      if (connectionStatus.is_sender) {
        return (
          <button
            className="connect-btn pending"
            onClick={handleConnectionAction}
          >
            Pending
          </button>
        );
      } else {
        return (
          <div className="request-buttons">
            <button
              className="accept-btn"
              onClick={() => onConnectionAction('accept')}
            >
              Accept
            </button>
            <button
              className="ignore-btn"
              onClick={() => onConnectionAction('ignore')}
            >
              Ignore
            </button>
          </div>
        );
      }
    }

    if (connectionStatus.status === 'accepted') {
      return (
        <button
          className="connect-btn connected"
          onClick={handleConnectionAction}
        >
          Connected
        </button>
      );
    }

    return null;
  };

  return (
    <div className="profile-view">
      <div className="profile-header">
        <div className="profile-cover">
          <img
            src={profile?.cover_image || '/default-cover.jpg'}
            alt="Cover"
            className="cover-image"
          />
        </div>

        <div className="profile-info">
          <div className="profile-photo">
            <img
              src={profile?.profile_image || '/default-avatar.jpg'}
              alt={`${user?.first_name} ${user?.last_name}`}
              className="photo"
            />
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{user?.first_name} {user?.last_name}</h1>
            <p className="profile-headline">{profile?.headline || 'No headline'}</p>
            <p className="profile-location">{profile?.location || 'No location'}</p>
          </div>

          <div className="profile-actions">
            {isCurrentUser ? (
              <button
                className="edit-profile-btn"
                onClick={handleEditClick}
              >
                Edit Profile
              </button>
            ) : (
              <div className="visitor-actions">
                {renderConnectionButton()}
                <button className="message-btn">
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCurrentUser && profileStrength < 100 && (
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

      <div className="profile-about">
        <h2 className="section-title">About</h2>
        {profile?.about ? (
          <p className="about-text">{profile.about}</p>
        ) : (
          <p className="empty-text">No information provided.</p>
        )}
        {isCurrentUser && !profile?.about && (
          <button
            className="add-about-btn"
            onClick={handleEditClick}
          >
            Add about
          </button>
        )}
      </div>

      <ExperienceSection
        experiences={profile?.experiences || []}
        isEditable={false}
      />

      <EducationSection
        educations={profile?.educations || []}
        isEditable={false}
      />

      <SkillsSection
        skills={profile?.skills || []}
        isEditable={false}
        canEndorse={!isCurrentUser}
      />

      {profile?.website && (
        <div className="profile-contact">
          <h2 className="section-title">Contact</h2>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">Website:</span>
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="contact-value">
                {profile.website}
              </a>
            </div>

            {profile.phone_number && (
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">{profile.phone_number}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;