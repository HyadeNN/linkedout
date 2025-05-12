import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    headline: '',
    about: '',
    location: '',
    phone_number: '',
    website: '',
    profile_image: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getCurrentUserProfile();
        setProfile(profileData);
        setFormData({
          headline: profileData.headline || '',
          about: profileData.about || '',
          location: profileData.location || '',
          phone_number: profileData.phone_number || '',
          website: profileData.website || '',
          profile_image: profileData.profile_image || ''
        });
        setImagePreview(profileData.profile_image || '');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        if (error.response && error.response.status === 404) {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle profile image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      try {
        const url = await profileService.uploadProfileImage(file);
        setFormData(prev => ({ ...prev, profile_image: url }));
      } catch (error) {
        alert('Failed to upload image.');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await profileService.updateProfile(formData);
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <h1 className="page-title">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <img
              src={imagePreview || ''}
              alt="Profile Preview"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
            />
            <div>
              <input
                type="file"
                accept="image/*"
                id="profile-image-upload"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <label htmlFor="profile-image-upload" style={{ cursor: 'pointer', color: '#0077b5', fontWeight: 600 }}>
                Change Profile Photo
              </label>
            </div>
          </div>
          <input
            type="text"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="Headline"
            className="form-input"
          />
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            placeholder="About"
            className="form-input"
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="form-input"
          />
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="Phone Number"
            className="form-input"
          />
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="Website"
            className="form-input"
          />
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;