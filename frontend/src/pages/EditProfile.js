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
    website: ''
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getCurrentUserProfile();
        setProfile(profileData);

        // Set form data from profile
        setFormData({
          headline: profileData.headline || '',
          about: profileData.about || '',
          location: profileData.location || '',
          phone_number: profileData.phone_number || '',
          website: profileData.website || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // If profile doesn't exist, we'll create a new one
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (profile) {
        // Update existing profile
        await profileService.updateProfile(formData);
      } else {
        // Create new profile
        await profileService.updateProfile(formData);
      }

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
          <div className="form-section">
            <h2 className="section-title">Intro</h2>

            <div className="form-group">
              <label htmlFor="headline">Headline</label>
              <input
                type="text"
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Your professional headline"
                disabled={saving}
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
                placeholder="Write a summary about yourself"
                rows={5}
                disabled={saving}
              />
              <p className="form-hint">Describe your experience, skills and accomplishments.</p>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Contact Information</h2>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/profile')}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;