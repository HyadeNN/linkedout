import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiEdit2, FiSettings } from 'react-icons/fi';
import { profileService } from '../../services/profile';
import { Link } from 'react-router-dom';
import './ProfileHeader.css';

const ProfileHeader = ({ profile, onProfileImageChange, onCoverImageChange, onFieldChange, onSaveProfile }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    headline: profile?.headline || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    about: profile?.profile?.about || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await profileService.updateProfile({
        name: formData.name,
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio,
        profile: {
          ...profile?.profile,
          about: formData.about
        }
      });
      setIsEditing(false);
      onSaveProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = type === 'profile' 
        ? await profileService.uploadProfileImage(file)
        : await profileService.uploadCoverImage(file);

      if (type === 'profile') {
        onProfileImageChange({ target: { files: [file] } });
      } else {
        onCoverImageChange({ target: { files: [file] } });
      }
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="profile-header">
      <div className="cover-photo">
        {profile?.profile?.cover_image ? (
          <img src={profile.profile.cover_image} alt="Cover" />
        ) : (
          <div className="cover-placeholder" />
        )}
        <label className="edit-cover-btn-modern" disabled={isUploading}>
          <FiEdit2 style={{ marginRight: '6px' }} />
          {isUploading ? 'Uploading...' : 'Edit Cover'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'cover')}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </label>
      </div>
      <div className="profile-info">
        <div className="profile-photo">
          {profile?.profile?.profile_image ? (
            <img src={profile.profile.profile_image} alt="Profile" />
          ) : (
            <div className="profile-placeholder" />
          )}
          <label className="upload-button profile-upload" disabled={isUploading}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, 'profile')}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            {isUploading ? 'Uploading...' : 'Change Photo'}
          </label>
        </div>
        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
              />
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder="Headline"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
              />
              <input
                type="text"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Bio"
              />
              <div className="form-actions">
                <button type="submit" className="save-button">Save</button>
                <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1>{profile?.name}</h1>
              <p className="headline">{profile?.headline}</p>
              <p className="location">{profile?.location}</p>
              <div className="profile-actions">
                <button className="edit-button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
                <Link to="/profile/settings" className="settings-button">
                  <FiSettings />
                  Account Settings
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 