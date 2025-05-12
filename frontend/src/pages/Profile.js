import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUserProfile, updateProfile, uploadProfileImage, uploadCoverImage, addExperience, updateExperience, deleteExperience, addEducation, updateEducation, deleteEducation, addSkill, updateSkill, deleteSkill } from '../services/profile';
import { useAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import ExperienceSection from '../components/profile/ExperienceSection';
import EducationSection from '../components/profile/EducationSection';
import SkillsSection from '../components/profile/SkillsSection';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('about');

  // Fetch user profile
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Get profile data
        const profileData = await getCurrentUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        if (error.response && error.response.status === 404) {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadProfileImage(file);
      setProfile(prev => ({ ...prev, profile_image: url }));
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadCoverImage(file);
      setProfile(prev => ({ ...prev, cover_image: url }));
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    await updateProfile(profile);
    alert('Profile updated!');
  };

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <ProfileHeader 
        profile={profile}
        onProfileImageChange={handleProfileImageChange}
        onCoverImageChange={handleCoverImageChange}
        onFieldChange={handleFieldChange}
        onSaveProfile={handleSaveProfile}
      />

      <div className="profile-content">
        <div className="profile-tabs">
          <button 
            className={`tab-button ${selectedTab === 'about' ? 'active' : ''}`}
            onClick={() => handleTabChange('about')}
          >
            About
          </button>
          <button 
            className={`tab-button ${selectedTab === 'experience' ? 'active' : ''}`}
            onClick={() => handleTabChange('experience')}
          >
            Experience
          </button>
          <button 
            className={`tab-button ${selectedTab === 'education' ? 'active' : ''}`}
            onClick={() => handleTabChange('education')}
          >
            Education
          </button>
          <button 
            className={`tab-button ${selectedTab === 'skills' ? 'active' : ''}`}
            onClick={() => handleTabChange('skills')}
          >
            Skills
          </button>
        </div>

        <div className="tab-content">
          {selectedTab === 'about' && (
            <div className="about-section">
              <h2>About</h2>
              <p>{profile?.bio || 'No bio available'}</p>
            </div>
          )}

          {selectedTab === 'experience' && (
            <ExperienceSection 
              experiences={profile?.experiences || []}
              onAddExperience={addExperience}
              onUpdateExperience={updateExperience}
              onDeleteExperience={deleteExperience}
            />
          )}

          {selectedTab === 'education' && (
            <EducationSection 
              educations={profile?.educations || []}
              onAddEducation={addEducation}
              onUpdateEducation={updateEducation}
              onDeleteEducation={deleteEducation}
            />
          )}

          {selectedTab === 'skills' && (
            <SkillsSection 
              skills={profile?.skills || []}
              onAddSkill={addSkill}
              onUpdateSkill={updateSkill}
              onDeleteSkill={deleteSkill}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;