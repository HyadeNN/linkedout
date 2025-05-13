import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import './NewPost.css';

const NewPost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef(null);
  const hashtagInputRef = useRef(null);

  useEffect(() => {
    const fetchSuggestedHashtags = async () => {
      if (currentHashtag.trim().length > 0) {
        try {
          const hashtagsRef = collection(db, 'hashtags');
          const q = query(
            hashtagsRef,
            where('name', '>=', currentHashtag.toLowerCase()),
            where('name', '<=', currentHashtag.toLowerCase() + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          const suggestions = querySnapshot.docs.map(doc => doc.data().name);
          setSuggestedHashtags(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggested hashtags:', error);
        }
      } else {
        setSuggestedHashtags([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestedHashtags();
  }, [currentHashtag]);

  const handleTextClick = () => {
    setExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setImage(null);
    setImagePreview(null);
    setExpanded(false);
    setHashtags([]);
    setCurrentHashtag('');
    setSuggestedHashtags([]);
    setShowSuggestions(false);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleHashtagChange = (e) => {
    const value = e.target.value;
    setCurrentHashtag(value);
  };

  const handleHashtagKeyDown = (e) => {
    if (e.key === 'Enter' && currentHashtag.trim()) {
      e.preventDefault();
      addHashtag(currentHashtag.trim());
    }
  };

  const addHashtag = async (hashtag) => {
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    if (!hashtags.includes(formattedHashtag)) {
      setHashtags([...hashtags, formattedHashtag]);
      
      // Add hashtag to Firestore if it doesn't exist
      try {
        const hashtagsRef = collection(db, 'hashtags');
        const q = query(hashtagsRef, where('name', '==', formattedHashtag.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          await addDoc(hashtagsRef, {
            name: formattedHashtag.toLowerCase(),
            count: 1,
            createdAt: new Date().toISOString()
          });
        } else {
          const hashtagDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'hashtags', hashtagDoc.id), {
            count: hashtagDoc.data().count + 1
          });
        }
      } catch (error) {
        console.error('Error updating hashtag:', error);
      }
    }
    
    setCurrentHashtag('');
    setShowSuggestions(false);
  };

  const removeHashtag = (hashtagToRemove) => {
    setHashtags(hashtags.filter(hashtag => hashtag !== hashtagToRemove));
  };

  const handleSuggestionClick = (suggestion) => {
    addHashtag(suggestion);
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
      const newPost = await postService.createPost(user.uid, {
        content,
        image,
        hashtags
      });

      // Update hashtag counts in Firestore
      for (const hashtag of hashtags) {
        const hashtagsRef = collection(db, 'hashtags');
        const q = query(hashtagsRef, where('name', '==', hashtag.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const hashtagDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'hashtags', hashtagDoc.id), {
            count: hashtagDoc.data().count + 1
          });
        }
      }

      setContent('');
      setImage(null);
      setImagePreview(null);
      setExpanded(false);
      setHashtags([]);
      setCurrentHashtag('');
      setSuggestedHashtags([]);
      setShowSuggestions(false);

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
          <div className="post-input-container">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind?"
              className="post-textarea"
              autoFocus
              disabled={submitting}
            />
            <div className="hashtag-input-container">
              <input
                type="text"
                ref={hashtagInputRef}
                value={currentHashtag}
                onChange={handleHashtagChange}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Add hashtags (press Enter to add)"
                className="hashtag-input"
                disabled={submitting}
              />
              {showSuggestions && suggestedHashtags.length > 0 && (
                <div className="hashtag-suggestions">
                  {suggestedHashtags.map((suggestion, index) => (
                    <button
                      key={index}
                      className="hashtag-suggestion"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <div className="hashtag-list">
                {hashtags.map((hashtag, idx) => (
                  <div key={idx} className="hashtag-item">
                    {hashtag}
                    <button
                      type="button"
                      className="hashtag-remove"
                      onClick={() => removeHashtag(hashtag)}
                      disabled={submitting}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="post-input modern-post-input"
            onClick={handleTextClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f3f2ef',
              borderRadius: 24,
              padding: '10px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              minHeight: 48,
              fontSize: 16,
              color: '#666',
              marginBottom: 0
            }}
          >
            <span style={{ opacity: 0.8 }}>
              What's on your mind?
            </span>
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