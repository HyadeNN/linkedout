import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';

const NewPost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextClick = () => {
    setExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setImage(null);
    setImagePreview(null);
    setExpanded(false);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setExpanded(true);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (content.trim() === '' && !image) {
      return;
    }

    try {
      setSubmitting(true);
      const newPost = await postService.createPost(content, image);

      setContent('');
      setImage(null);
      setImagePreview(null);
      setExpanded(false);

      onPostCreated(newPost);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-post-card">
      <div className="post-form-header">
        <img
          src={user?.profile?.profile_image || '/default-avatar.jpg'}
          alt={`${user?.first_name} ${user?.last_name}`}
          className="user-avatar"
        />

        {expanded ? (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's on your mind?"
            className="post-textarea"
            autoFocus
            disabled={submitting}
          />
        ) : (
          <div
            className="post-input"
            onClick={handleTextClick}
          >
            What's on your mind?
          </div>
        )}
      </div>

      {expanded && (
        <div className="post-form-expanded">
          {imagePreview && (
            <div className="image-preview-container">
              <img
                src={imagePreview}
                alt="Preview"
                className="image-preview"
              />
              <button
                className="remove-image-btn"
                onClick={handleRemoveImage}
                disabled={submitting}
              >
                &times;
              </button>
            </div>
          )}

          <div className="post-form-actions">
            <div className="post-form-attachments">
              <button
                type="button"
                className="attachment-btn"
                onClick={handleImageClick}
                disabled={submitting}
              >
                <span className="attachment-icon">📷</span>
                <span>Photo</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={submitting}
              />
            </div>

            <div className="post-form-submit">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="post-btn"
                onClick={handleSubmit}
                disabled={submitting || (content.trim() === '' && !image)}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPost;