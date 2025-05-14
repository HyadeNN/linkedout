import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { FaSearch, FaHashtag, FaUser, FaNewspaper, FaArrowLeft, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [sortDirection, setSortDirection] = useState('desc');
  const [allHashtags, setAllHashtags] = useState([]);
  const [loadingHashtags, setLoadingHashtags] = useState(true);
  const navigate = useNavigate();

  const searchQuery = searchParams.get('q');

  // Fetch all hashtags for sidebar
  useEffect(() => {
    const fetchAllHashtags = async () => {
      try {
        setLoadingHashtags(true);
        const postsRef = collection(db, 'posts');
        const postsSnapshot = await getDocs(postsRef);
        
        const hashtagCounts = {};
        postsSnapshot.docs.forEach(doc => {
          const hashtags = doc.data().hashtags || [];
          hashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        });

        const sortedHashtags = Object.entries(hashtagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setAllHashtags(sortedHashtags);
      } catch (error) {
        console.error('Error fetching hashtags:', error);
      } finally {
        setLoadingHashtags(false);
      }
    };

    fetchAllHashtags();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        if (searchQuery) {
          let results = [];
          const searchTerm = searchQuery.toLowerCase();

          switch (activeTab) {
            case 'posts':
              // Search in posts collection with dynamic sort order
              const postsQuery = query(
                collection(db, 'posts'),
                where('content', '>=', searchTerm),
                where('content', '<=', searchTerm + '\uf8ff'),
                orderBy('content'),
                orderBy('createdAt', sortDirection),
                limit(20)
              );
              const postsSnapshot = await getDocs(postsQuery);
              
              // Get user data for each post
              results = await Promise.all(postsSnapshot.docs.map(async (doc) => {
                const postData = doc.data();
                const userDoc = await getDocs(doc(db, 'users', postData.userId));
                const userData = userDoc.data();
                
                return {
                  id: doc.id,
                  ...postData,
                  author: {
                    first_name: userData?.name?.split(' ')[0] || '',
                    last_name: userData?.name?.split(' ').slice(1).join(' ') || '',
                    profile: {
                      headline: userData?.headline || '',
                      profile_image: userData?.profile?.profile_image || null
                    }
                  }
                };
              }));
              break;

            case 'users':
              // Search in users collection
              const usersQuery = query(
                collection(db, 'users'),
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'),
                orderBy('name'),
                limit(20)
              );
              const usersSnapshot = await getDocs(usersQuery);
              results = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                first_name: doc.data().name?.split(' ')[0] || '',
                last_name: doc.data().name?.split(' ').slice(1).join(' ') || '',
                profile: {
                  headline: doc.data().headline || '',
                  profile_image: doc.data().profile?.profile_image || null
                }
              }));
              break;

            case 'hashtags':
              // Search in posts collection for hashtags
              const hashtagsQuery = query(
                collection(db, 'posts'),
                where('hashtags', 'array-contains', '#' + searchTerm),
                orderBy('createdAt', 'desc'),
                limit(20)
              );
              const hashtagsSnapshot = await getDocs(hashtagsQuery);
              
              // Count posts per hashtag
              const hashtagCounts = {};
              hashtagsSnapshot.docs.forEach(doc => {
                const hashtags = doc.data().hashtags || [];
                hashtags.forEach(tag => {
                  if (tag.toLowerCase().includes(searchTerm)) {
                    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
                  }
                });
              });
              
              results = Object.entries(hashtagCounts).map(([name, count]) => ({
                name,
                count
              }));
              break;

            default:
              results = [];
          }
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, activeTab, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/?hashtag=${encodeURIComponent(hashtag.replace('#', ''))}`);
  };

  const handleBackToFeed = () => {
    navigate('/');
  };

  const renderPostResults = () => {
    if (searchResults.length === 0) return null;

    return searchResults.map((result) => (
      <div key={result.id} className="post-card">
        <div className="post-header">
          <img
            src={result.author?.profile?.profile_image || '/default-avatar.jpg'}
            alt={`${result.author?.first_name} ${result.author?.last_name}`}
            className="profile-image"
          />
          <div className="post-info">
            <h3>{result.author?.first_name} {result.author?.last_name}</h3>
            <p className="headline">{result.author?.profile?.headline}</p>
          </div>
        </div>

        <div className="post-content">
          <p>{result.content}</p>
          {result.hashtags && result.hashtags.length > 0 && (
            <div className="post-hashtags">
              {result.hashtags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHashtagClick(tag)}
                  className="hashtag-button"
                >
                  <FaHashtag className="hashtag-icon" />
                  {tag.replace('#', '')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
  };

  const renderUserResults = () => {
    if (searchResults.length === 0) return null;

    return searchResults.map((user) => (
      <div key={user.id} className="user-card">
        <img
          src={user.profile?.profile_image || '/default-avatar.jpg'}
          alt={`${user.first_name} ${user.last_name}`}
          className="profile-image"
        />
        <div className="user-info">
          <h3>{user.first_name} {user.last_name}</h3>
          <p className="headline">{user.profile?.headline}</p>
        </div>
      </div>
    ));
  };

  const renderHashtagResults = () => {
    if (searchResults.length === 0) return null;

    return searchResults.map((hashtag) => (
      <div key={hashtag.name} className="hashtag-card" onClick={() => handleHashtagClick(hashtag.name)}>
        <FaHashtag className="hashtag-icon" />
        <div className="hashtag-info">
          <h3>{hashtag.name}</h3>
          <p>{hashtag.count} posts</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-main">
          <div className="search-header">
            <div className="search-header-top">
              <button onClick={handleBackToFeed} className="back-button">
                <FaArrowLeft /> Ana Feed'e Dön
              </button>
              <button onClick={toggleSortDirection} className="sort-button">
                {sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                <span>{sortDirection === 'desc' ? 'En Yeni' : 'En Eski'}</span>
              </button>
            </div>
            <div className="search-tabs">
              <button
                className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                <FaNewspaper />
                <span>Gönderiler</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <FaUser />
                <span>Kullanıcılar</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'hashtags' ? 'active' : ''}`}
                onClick={() => setActiveTab('hashtags')}
              >
                <FaHashtag />
                <span>Hashtagler</span>
              </button>
            </div>
            {searchQuery && (
              <div className="search-query">
                <FaSearch />
                <span>"{searchQuery}" için arama sonuçları</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Aranıyor...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="no-results">
              <FaSearch className="no-results-icon" />
              <h2>Sonuç bulunamadı</h2>
              <p>
                Farklı anahtar kelimeler deneyin veya yazımı kontrol edin
              </p>
            </div>
          ) : (
            <div className="search-results">
              {activeTab === 'posts' && renderPostResults()}
              {activeTab === 'users' && renderUserResults()}
              {activeTab === 'hashtags' && renderHashtagResults()}
            </div>
          )}
        </div>

        <div className="search-sidebar">
          <div className="sidebar-section">
            <h3>Son Aramalar</h3>
            <div className="recent-searches">
              <p className="no-recents">Henüz arama yapılmadı</p>
            </div>
          </div>
          <div className="sidebar-section">
            <h3>Popüler Hashtagler</h3>
            <div className="hashtags-list">
              {loadingHashtags ? (
                <div className="sidebar-loading">Yükleniyor...</div>
              ) : allHashtags.length === 0 ? (
                <p className="no-hashtags">Hashtag bulunamadı</p>
              ) : (
                allHashtags.map((hashtag) => (
                  <button
                    key={hashtag.name}
                    className="sidebar-hashtag-button"
                    onClick={() => handleHashtagClick(hashtag.name)}
                  >
                    <FaHashtag className="hashtag-icon" />
                    <span>{hashtag.name.replace('#', '')}</span>
                    <span className="hashtag-count">{hashtag.count}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search; 