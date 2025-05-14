import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import NewPost from './NewPost';
import PostList from './PostList';
import Header from '../common/Header';
import './Feed.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHashtag, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();
  const location = useLocation();

  // URL'den parametreleri al
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashtagParam = params.get('hashtag');
    const searchParam = params.get('search');
    const sortParam = params.get('sort');
    
    if (hashtagParam) {
      setSelectedHashtag(hashtagParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (sortParam) {
      setSortDirection(sortParam);
    }
  }, [location]);

  // Fetch posts with hashtag filter and sorting
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let postsQuery;
        
        if (selectedHashtag) {
          postsQuery = query(
            collection(db, 'posts'),
            where('hashtags', 'array-contains', '#' + selectedHashtag),
            orderBy('createdAt', sortDirection)
          );
        } else {
          postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', sortDirection)
          );
        }

        const snapshot = await getDocs(postsQuery);
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const postData = doc.data();
            const post = {
              id: doc.id,
              content: postData.content,
              image_url: postData.imageUrl,
              created_at: postData.createdAt?.toDate?.() || new Date(),
              hashtags: postData.hashtags || [],
              likes_count: postData.likesCount || 0,
              comments_count: postData.commentsCount || 0,
              author_id: postData.userId
            };

            // Fetch author data
            if (postData.userId) {
              const authorDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', postData.userId)));
              if (!authorDoc.empty) {
                const authorData = authorDoc.docs[0].data();
                post.author = {
                  first_name: authorData.name?.split(' ')[0] || '',
                  last_name: authorData.name?.split(' ').slice(1).join(' ') || '',
                  profile: {
                    headline: authorData.headline || '',
                    profile_image: authorData.profile?.profile_image || null
                  }
                };
              }
            }

            return post;
          })
        );

        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedHashtag, sortDirection]); // sortDirection değiştiğinde yeniden çek

  // Arama sonuçlarını güncelle
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setFilteredPosts(posts);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const results = posts.filter(post => 
      post.content.toLowerCase().includes(searchLower) ||
      post.author?.first_name.toLowerCase().includes(searchLower) ||
      post.author?.last_name.toLowerCase().includes(searchLower)
    );
    
    setSearchResults(results);
    setFilteredPosts(results);
  }, [searchTerm, posts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const params = new URLSearchParams(location.search);
    params.set('search', searchTerm.trim());
    if (selectedHashtag) {
      params.set('hashtag', selectedHashtag);
    }
    navigate(`?${params.toString()}`);
  };

  const handleSearchResultClick = (result) => {
    const params = new URLSearchParams(location.search);
    params.set('search', result);
    if (selectedHashtag) {
      params.set('hashtag', selectedHashtag);
    }
    navigate(`?${params.toString()}`);
    setSearchTerm(result);
  };

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
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
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 hashtags

        setTrendingHashtags(sortedHashtags);
      } catch (error) {
        console.error('Error fetching trending hashtags:', error);
      }
    };

    fetchTrendingHashtags();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newDirection);
    
    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('sort', newDirection);
    navigate(`?${params.toString()}`);
  };

  const handleHashtagClick = (hashtag) => {
    const tagName = hashtag.replace(/^#/, '');
    setSelectedHashtag(tagName);
    
    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('hashtag', tagName);
    navigate(`?${params.toString()}`);
  };

  const clearHashtagFilter = () => {
    setSelectedHashtag(null);
    const params = new URLSearchParams(location.search);
    params.delete('hashtag');
    navigate(`?${params.toString()}`);
  };

  return (
    <div className="feed">
      <Header />
      <div className="feed-container">
        <div className="feed-main">
          <div className="feed-header">
            <div className="feed-header-top">
              {selectedHashtag && (
                <div className="active-filter">
                  <div className="filter-tag">
                    <FaHashtag />
                    <span>{selectedHashtag}</span>
                  </div>
                  <button onClick={clearHashtagFilter} className="clear-filter">
                    Filtreyi Kaldır
                  </button>
                </div>
              )}
              <button onClick={toggleSortDirection} className="sort-button">
                {sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                <span>{sortDirection === 'desc' ? 'En Yeni' : 'En Eski'}</span>
              </button>
            </div>
          </div>

          <NewPost onPostCreated={handlePostCreated} />
          
          <div className="search-wrapper">
            <form onSubmit={handleSearch} className="search-container">
              <input
                type="text"
                placeholder="Gönderi veya kişi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">Ara</button>
            </form>
            
            {searchResults.length > 0 && searchTerm && (
              <div className="search-results">
                {searchResults.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(
                      result.author?.first_name + ' ' + result.author?.last_name
                    )}
                  >
                    <div className="result-author">
                      {result.author?.first_name} {result.author?.last_name}
                    </div>
                    <div className="result-preview">{result.content.slice(0, 50)}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-indicator">Gönderiler yükleniyor...</div>
          ) : (
            <PostList
              posts={filteredPosts}
              onUpdatePost={handlePostUpdate}
              onDeletePost={handlePostDelete}
              onHashtagClick={handleHashtagClick}
            />
          )}
        </div>

        <div className="feed-sidebar">
          <div className="trending-hashtags">
            <h3>Popüler Hashtagler</h3>
            <div className="hashtag-list">
              {trendingHashtags.map((hashtag, index) => (
                <button
                  key={index}
                  className={`hashtag-button ${selectedHashtag === hashtag.name.replace('#', '') ? 'active' : ''}`}
                  onClick={() => handleHashtagClick(hashtag.name)}
                >
                  <FaHashtag className="hashtag-icon" />
                  <span>{hashtag.name.replace('#', '')}</span>
                  <span className="hashtag-count">{hashtag.count} gönderi</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed; 