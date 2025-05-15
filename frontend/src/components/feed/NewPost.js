import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
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
  const [userProfile, setUserProfile] = useState(null);
  const fileInputRef = useRef(null);
  const hashtagInputRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

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
          src={userProfile?.profile?.profile_image || '/default-avatar.jpg'}
          alt={userProfile?.name || 'User'}
          className="user-avatar"
        />

        {expanded ? (
          <div className="post-input-container">
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={handleContentChange}
              className="post-input"
            />
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button onClick={handleRemoveImage} className="remove-image-btn">
                  ✕
                </button>
              </div>
            )}
            {hashtags.length > 0 && (
              <div className="hashtags-container">
                {hashtags.map((hashtag, index) => (
                  <span key={index} className="hashtag-pill">
                    {hashtag}
                    <button
                      onClick={() => removeHashtag(hashtag)}
                      className="remove-hashtag-btn"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="post-actions">
              <div className="post-tools">
                <button onClick={handleImageClick} className="tool-btn">
                  📷 Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="hashtag-input-container">
                  <input
                    type="text"
                    placeholder="Add hashtag"
                    value={currentHashtag}
                    onChange={handleHashtagChange}
                    onKeyDown={handleHashtagKeyDown}
                    ref={hashtagInputRef}
                    className="hashtag-input"
                  />
                  {showSuggestions && suggestedHashtags.length > 0 && (
                    <div className="hashtag-suggestions">
                      {suggestedHashtags.map((suggestion, index) => (
                        <div
                          key={index}
                          className="hashtag-suggestion"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="post-buttons">
                <button onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (!content.trim() && !image)}
                  className="post-btn"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="post-input-placeholder"
            onClick={handleTextClick}
          >
            What's on your mind?
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPost;