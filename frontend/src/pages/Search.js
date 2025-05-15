import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit, getDoc, doc } from 'firebase/firestore';
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
              const postsCollectionRef = collection(db, 'posts');
              const postsQuery = query(
                postsCollectionRef,
                orderBy('createdAt', sortDirection),
                limit(100)
              );
              const postsSnapshot = await getDocs(postsQuery);
              
              const filteredPostDocs = postsSnapshot.docs.filter(docSnapshot => {
                const postData = docSnapshot.data();
                // Check if post has content and userId
                return postData.content && 
                       postData.userId && 
                       postData.content?.toLowerCase().includes(searchTerm);
              });

              // Get user data for each filtered post
              results = await Promise.all(filteredPostDocs.slice(0, 20).map(async (docSnapshot) => {
                try {
                  const postData = docSnapshot.data();
                  if (!postData.userId) {
                    return null; // Skip posts without userId
                  }

                  const userDocRef = doc(db, 'users', postData.userId);
                  const userDocSnapshot = await getDoc(userDocRef);
                  
                  if (!userDocSnapshot.exists()) {
                    return null; // Skip if user doesn't exist
                  }

                  const userData = userDocSnapshot.data();
                  if (!userData) {
                    return null; // Skip if user data is empty
                  }
                  
                  return {
                    id: docSnapshot.id,
                    ...postData,
                    author: {
                      id: postData.userId,
                      first_name: userData?.name?.split(' ')[0] || '',
                      last_name: userData?.name?.split(' ').slice(1).join(' ') || '',
                      profile: {
                        headline: userData?.headline || '',
                        profile_image: userData?.profile?.profile_image || null
                      }
                    }
                  };
                } catch (error) {
                  console.error('Error fetching user data for post:', error);
                  return null;
                }
              }));

              // Filter out null results and ensure we have valid posts
              results = results.filter(result => result !== null);
              break;

            case 'users':
              // Search in users collection
              const usersCollectionRef = collection(db, 'users');
              const usersQuery = query(
                usersCollectionRef,
                orderBy('name'),
                limit(100)
              );
              const usersSnapshot = await getDocs(usersQuery);

              const filteredUserDocs = usersSnapshot.docs.filter(docSnapshot => {
                const userData = docSnapshot.data();
                // Check if user has a name
                return userData && userData.name && userData.name?.toLowerCase().includes(searchTerm);
              });

              results = filteredUserDocs.slice(0, 20).map(docSnapshot => {
                const userData = docSnapshot.data();
                return {
                  id: docSnapshot.id,
                  first_name: userData?.name?.split(' ')[0] || '',
                  last_name: userData?.name?.split(' ').slice(1).join(' ') || '',
                  profile: {
                    headline: userData?.headline || '',
                    profile_image: userData?.profile?.profile_image || null
                  }
                };
              });
              break;

            case 'hashtags':
              // Fetch posts to search their hashtags client-side for "contains" functionality
              const allPostsQueryForHashtags = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'), // Fetch recent posts
                limit(200) // Fetch a larger set of posts to find relevant hashtags. Adjust as needed.
              );
              const allPostsSnapshotForHashtags = await getDocs(allPostsQueryForHashtags);
              
              const matchedHashtagCounts = {};
              // searchTerm is already lowercased at the beginning of fetchResults

              allPostsSnapshotForHashtags.docs.forEach(doc => {
                const postData = doc.data();
                const postHashtags = postData.hashtags || [];
                postHashtags.forEach(tag => {
                  // Check if the hashtag (without '#') contains the search term
                  if (tag.toLowerCase().replace('#', '').includes(searchTerm)) { 
                    matchedHashtagCounts[tag] = (matchedHashtagCounts[tag] || 0) + 1;
                  }
                });
              });
              
              results = Object.entries(matchedHashtagCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count) // Sort by count
                .slice(0, 20); // Limit the number of displayed hashtag results
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
                <FaArrowLeft /> Back to Feed
              </button>
              <button onClick={toggleSortDirection} className="sort-button">
                {sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                <span>{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
            <div className="search-tabs">
              <button
                className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                <FaNewspaper />
                <span>Posts</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <FaUser />
                <span>Users</span>
              </button>
              <button
                className={`tab-button ${activeTab === 'hashtags' ? 'active' : ''}`}
                onClick={() => setActiveTab('hashtags')}
              >
                <FaHashtag />
                <span>Hashtags</span>
              </button>
            </div>
            {searchQuery && (
              <div className="search-query">
                <FaSearch />
                <span>Search results for "{searchQuery}"</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="no-results">
              <FaSearch className="no-results-icon" />
              <h2>No results found. Try different keywords or check your spelling</h2>
              <p>
                Try different keywords or check your spelling
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
            <h3>Recent Searches</h3>
            <div className="recent-searches">
              <p className="no-recents">No searches yet</p>
            </div>
          </div>
          <div className="sidebar-section">
            <h3>Popular Hashtags</h3>
            <div className="hashtags-list">
              {loadingHashtags ? (
                <div className="sidebar-loading">Loading...</div>
              ) : allHashtags.length === 0 ? (
                <p className="no-hashtags">No hashtags found</p>
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