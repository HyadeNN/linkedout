import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import './ProfileHeader.css';

const ProfileHeader = ({ profile, onProfileImageChange, onCoverImageChange, onFieldChange, onSaveProfile }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    headline: profile?.headline || '',
    location: profile?.location || '',
    bio: profile?.bio || ''
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
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio
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

    try {
      // Create a storage reference
      const storageRef = ref(storage, `${type}/${user.uid}/${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [type === 'profile' ? 'profile_image' : 'cover_image']: downloadURL
      });

      // Update local state
      if (type === 'profile') {
        onProfileImageChange({ target: { files: [file] } });
      } else {
        onCoverImageChange({ target: { files: [file] } });
      }
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
    }
  };

  return (
    <div className="profile-header">
      <div className="cover-photo">
        {profile?.cover_image ? (
          <img src={profile.cover_image} alt="Cover" />
        ) : (
          <div className="cover-placeholder" />
        )}
        <label className="upload-button cover-upload">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'cover')}
            style={{ display: 'none' }}
          />
          Change Cover Photo
        </label>
      </div>
      <div className="profile-info">
        <div className="profile-photo">
          {profile?.profile_image ? (
            <img src={profile.profile_image} alt="Profile" />
          ) : (
            <div className="profile-placeholder" />
          )}
          <label className="upload-button profile-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, 'profile')}
              style={{ display: 'none' }}
            />
            Change Photo
          </label>
        </div>
        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
                required
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
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Bio"
                rows="3"
              />
              <div className="button-group">
                <button type="submit" className="save-button">Save</button>
                <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1>{profile?.name || 'Your Name'}</h1>
              <p className="headline">{profile?.headline || 'Your Headline'}</p>
              <p className="location">{profile?.location || 'Your Location'}</p>
              <p className="bio">{profile?.bio || 'Your Bio'}</p>
              <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 