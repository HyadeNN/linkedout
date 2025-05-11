import React, { useState, useRef } from 'react';
import { profileService } from '../../services';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';

const ProfileEdit = ({
  profile,
  onUpdate,
  onCancel,
  onSave
}) => {
  const [formData, setFormData] = useState({
    headline: profile?.headline || '',
    about: profile?.about || '',
    location: profile?.location || '',
    phone_number: profile?.phone_number || '',
    website: profile?.website || ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('intro');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(profile?.profile_image || null);
  const [coverImagePreview, setCoverImagePreview] = useState(profile?.cover_image || null);

  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Update profile data
      await profileService.updateProfile(formData);

      // Upload profile image if selected
      if (profileImageFile) {
        await profileService.uploadProfileImage(profileImageFile);
      }

      // Upload cover image if selected
      if (coverImageFile) {
        await profileService.uploadCoverImage(coverImageFile);
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProfileImageClick = () => {
    profileImageInputRef.current.click();
  };

  const handleCoverImageClick = () => {
    coverImageInputRef.current.click();
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExperienceUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleEducationUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleSkillsUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="profile-edit">
      <div className="profile-cover-edit">
        <div
          className="cover-image-container"
          style={{ backgroundImage: `url(${coverImagePreview || '/default-cover.jpg'})` }}
        >
          <button
            className="edit-cover-btn"
            onClick={handleCoverImageClick}
            disabled={loading}
          >
            <span className="edit-icon">📷</span>
            Change Cover
          </button>
          <input
            type="file"
            ref={coverImageInputRef}
            onChange={handleCoverImageChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>

        <div className="profile-photo-edit">
          <div
            className="photo-container"
            style={{ backgroundImage: `url(${profileImagePreview || '/default-avatar.jpg'})` }}
            onClick={handleProfileImageClick}
          >
            <div className="photo-overlay">
              <span className="edit-icon">📷</span>
            </div>
          </div>
          <input
            type="file"
            ref={profileImageInputRef}
            onChange={handleProfileImageChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>
      </div>

      <div className="profile-edit-tabs">
        <button
          className={`tab-btn ${activeTab === 'intro' ? 'active' : ''}`}
          onClick={() => handleTabChange('intro')}
        >
          Intro
        </button>
        <button
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => handleTabChange('experience')}
        >
          Experience
        </button>
        <button
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => handleTabChange('education')}
        >
          Education
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => handleTabChange('skills')}
        >
          Skills
        </button>
      </div>

      <div className="profile-edit-content">
        {activeTab === 'intro' && (
          <form onSubmit={handleSubmit} className="intro-form">
            <div className="form-group">
              <label htmlFor="headline">Headline</label>
              <input
                type="text"
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Your professional headline"
                disabled={loading}
              />
              <p className="form-hint">Add a headline that describes your professional role or expertise.</p>
            </div>

            <div className="form-group">
              <label htmlFor="about">About</label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={5}
                disabled={loading}
              />
              <p className="form-hint">Describe your experience, skills, and achievements.</p>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Your phone number"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Your website or portfolio"
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'experience' && (
          <ExperienceSection
            experiences={profile?.experiences || []}
            isEditable={true}
            onUpdate={handleExperienceUpdate}
          />
        )}

        {activeTab === 'education' && (
          <EducationSection
            educations={profile?.educations || []}
            isEditable={true}
            onUpdate={handleEducationUpdate}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsSection
            skills={profile?.skills || []}
            isEditable={true}
            onUpdate={handleSkillsUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEdit;