import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services';
import ProfileEdit from '../components/profile/ProfileEdit';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getCurrentUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // If profile doesn't exist, we'll create a new one
        if (error.response && error.response.status === 404) {
          setProfile(null);
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleSave = () => {
    navigate('/profile');
  };

  const handleUpdate = async () => {
    try {
      const profileData = await profileService.getCurrentUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <h1 className="page-title">Edit Profile</h1>
        <ProfileEdit
          profile={profile}
          onUpdate={handleUpdate}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default EditProfile;