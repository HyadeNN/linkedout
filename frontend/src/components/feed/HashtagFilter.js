import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';

const HashtagFilter = ({ onHashtagSelect, selectedHashtag }) => {
  const { user } = useAuth();
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [followedHashtags, setFollowedHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        setLoading(true);
        const [trending, followed] = await Promise.all([
          postService.getTrendingHashtags(),
          postService.getFollowedHashtags(user.uid)
        ]);
        setTrendingHashtags(trending);
        setFollowedHashtags(followed);
      } catch (error) {
        console.error('Error fetching hashtags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHashtags();
  }, [user.uid]);

  const handleFollowHashtag = async (hashtag) => {
    try {
      await postService.followHashtag(user.uid, hashtag);
      setFollowedHashtags([...followedHashtags, hashtag]);
    } catch (error) {
      console.error('Error following hashtag:', error);
    }
  };

  const handleUnfollowHashtag = async (hashtag) => {
    try {
      await postService.unfollowHashtag(user.uid, hashtag);
      setFollowedHashtags(followedHashtags.filter(h => h !== hashtag));
    } catch (error) {
      console.error('Error unfollowing hashtag:', error);
    }
  };

  if (loading) {
    return <div className="hashtag-filter-loading">Loading hashtags...</div>;
  }

  return (
    <div className="hashtag-filter">
      <div className="hashtag-section">
        <h3 className="section-title">Followed Hashtags</h3>
        <div className="hashtag-list">
          {followedHashtags.length > 0 ? (
            followedHashtags.map((hashtag, index) => (
              <div
                key={index}
                className={`hashtag-item ${selectedHashtag === hashtag ? 'selected' : ''}`}
              >
                <button
                  className="hashtag-button"
                  onClick={() => onHashtagSelect(hashtag)}
                >
                  {hashtag}
                </button>
                <button
                  className="unfollow-button"
                  onClick={() => handleUnfollowHashtag(hashtag)}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="no-hashtags">No followed hashtags</p>
          )}
        </div>
      </div>

      <div className="hashtag-section">
        <h3 className="section-title">Trending Hashtags</h3>
        <div className="hashtag-list">
          {trendingHashtags.map((hashtag, index) => (
            <div
              key={index}
              className={`hashtag-item ${selectedHashtag === hashtag ? 'selected' : ''}`}
            >
              <button
                className="hashtag-button"
                onClick={() => onHashtagSelect(hashtag)}
              >
                {hashtag}
              </button>
              {!followedHashtags.includes(hashtag) && (
                <button
                  className="follow-button"
                  onClick={() => handleFollowHashtag(hashtag)}
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HashtagFilter; 