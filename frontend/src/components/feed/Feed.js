import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import NewPost from './NewPost';
import PostList from './PostList';
import Header from '../common/Header';
import './Feed.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // URL'den parametreleri al
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashtagParam = params.get('hashtag');
    const searchParam = params.get('search');
    
    if (hashtagParam) {
      setSelectedHashtag(hashtagParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location]);

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
        const hashtagsRef = collection(db, 'hashtags');
        const q = query(hashtagsRef, orderBy('count', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const hashtags = querySnapshot.docs.map(doc => ({
          name: doc.data().name,
          count: doc.data().count
        }));
        setTrendingHashtags(hashtags);
      } catch (error) {
        console.error('Error fetching trending hashtags:', error);
      }
    };

    fetchTrendingHashtags();
  }, []);

  // Fetch posts with hashtag filter
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let postsQuery;
        
        if (selectedHashtag) {
          postsQuery = query(
            collection(db, 'posts'),
            where('hashtags', 'array-contains', selectedHashtag),
            orderBy('createdAt', 'desc')
          );
        } else {
          postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
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
            const authorDoc = await getDoc(doc(db, 'users', post.author_id));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              post.author = {
                first_name: authorData.name?.split(' ')[0] || '',
                last_name: authorData.name?.split(' ').slice(1).join(' ') || '',
                profile: {
                  headline: authorData.headline || '',
                  profile_image: authorData.profile?.profile_image || null
                }
              };
            }

            return post;
          })
        );

        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedHashtag]);

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

  const handleHashtagClick = (hashtag) => {
    setSelectedHashtag(hashtag === selectedHashtag ? null : hashtag);
  };

  return (
    <div className="feed">
      <Header />
      <div className="feed-container">
        <div className="feed-main">
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

          {selectedHashtag && (
            <div className="active-filter">
              <span>Filtering by: {selectedHashtag}</span>
              <button onClick={() => setSelectedHashtag(null)}>Clear Filter</button>
            </div>
          )}

          {loading ? (
            <div className="loading-indicator">Loading posts...</div>
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
            <h3>Trending Hashtags</h3>
            <div className="hashtag-list">
              {trendingHashtags.map((hashtag, index) => (
                <button
                  key={index}
                  className={`hashtag-button ${selectedHashtag === hashtag.name ? 'active' : ''}`}
                  onClick={() => handleHashtagClick(hashtag.name)}
                >
                  {hashtag.name}
                  <span className="hashtag-count">{hashtag.count}</span>
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