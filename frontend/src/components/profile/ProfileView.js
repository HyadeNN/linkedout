import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProfileHeader from './ProfileHeader';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import './ProfileView.css';

const ProfileView = () => {
  const { user } = useAuth();
  console.log('ProfileView user:', user);
  const [activeTab, setActiveTab] = useState('posts');
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const profile = userData.profile || {};

        setProfileData({
          ...userData,
          coverPhoto: profile.cover_image || userData.coverPhoto || null,
          profilePhoto: profile.profile_image || userData.profilePhoto || null,
          about: profile.about || '',
          name: userData.name || '',
          headline: userData.headline || '',
          location: userData.location || ''
        });

        // Fetch posts
        const postsQuery = query(collection(db, 'posts'), where('userId', '==', user.uid));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);

        // Fetch articles
        const articlesQuery = query(collection(db, 'articles'), where('userId', '==', user.uid));
        const articlesSnapshot = await getDocs(articlesQuery);
        const articlesData = articlesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setArticles(articlesData);

        // Fetch activities
        const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', user.uid));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivities(activitiesData);

        // Fetch interests
        const interestsQuery = query(collection(db, 'interests'), where('userId', '==', user.uid));
        const interestsSnapshot = await getDocs(interestsQuery);
        const interestsData = interestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInterests(interestsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user.uid]);

  const handleAddPost = async (postContent) => {
    try {
      const newPost = {
        content: postContent,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      };

      const postRef = await addDoc(collection(db, 'posts'), newPost);
      setPosts([...posts, { id: postRef.id, ...newPost }]);
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleAddArticle = async (articleData) => {
    try {
      const newArticle = {
        ...articleData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      };

      const articleRef = await addDoc(collection(db, 'articles'), newArticle);
      setArticles([...articles, { id: articleRef.id, ...newArticle }]);
    } catch (error) {
      console.error('Error adding article:', error);
    }
  };

  const handleAddInterest = async (interest) => {
    try {
      const updatedInterests = [...interests, interest];
      await updateDoc(doc(db, 'users', user.uid), {
        interests: updatedInterests
      });
      setInterests(updatedInterests);
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    try {
      const updatedInterests = interests.filter(interest => interest.id !== interestToRemove);
      await updateDoc(doc(db, 'users', user.uid), {
        interests: updatedInterests
      });
      setInterests(updatedInterests);
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentPost = async (postId) => {
    const comment = prompt('Enter your comment:');
    if (!comment) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      const currentComments = postDoc.data().comments || [];
      
      const newComment = {
        id: Date.now(),
        content: comment,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };

      await updateDoc(postRef, {
        comments: [...currentComments, newComment]
      });

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      ));
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const handleLikeArticle = async (articleId) => {
    try {
      const articleRef = doc(db, 'articles', articleId);
      await updateDoc(articleRef, {
        likes: increment(1)
      });
      
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, likes: article.likes + 1 }
          : article
      ));
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleCommentArticle = async (articleId) => {
    const comment = prompt('Enter your comment:');
    if (!comment) return;

    try {
      const articleRef = doc(db, 'articles', articleId);
      const articleDoc = await getDoc(articleRef);
      const currentComments = articleDoc.data().comments || [];
      
      const newComment = {
        id: Date.now(),
        content: comment,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };

      await updateDoc(articleRef, {
        comments: [...currentComments, newComment]
      });

      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, comments: [...(article.comments || []), newComment] }
          : article
      ));
    } catch (error) {
      console.error('Error commenting on article:', error);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `profile/${user.uid}/${type}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedProfile = { ...profileData, [type]: downloadURL };
      setProfileData(updatedProfile);
      await updateDoc(doc(db, 'users', user.uid), updatedProfile);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-view">
      <div className="profile-content">
        <ProfileHeader 
          user={user}
          onImageUpload={handleImageUpload}
        />
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab-button ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Articles
          </button>
          <button 
            className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
          <button 
            className={`tab-button ${activeTab === 'interests' ? 'active' : ''}`}
            onClick={() => setActiveTab('interests')}
          >
            Interests
          </button>
        </div>

        <div className="profile-sections">
          <div className="profile-images-section">
            {profileData?.coverPhoto && (
              <div className="cover-photo-container">
                <img src={profileData.coverPhoto} alt="Cover" className="cover-photo" />
              </div>
            )}
            {profileData?.profilePhoto && (
              <div className="profile-photo-container">
                <img src={profileData.profilePhoto} alt="Profile" className="profile-photo" />
              </div>
            )}
          </div>
          <ExperienceSection />
          <EducationSection />
          <SkillsSection />

          {activeTab === 'posts' && (
            <div className="posts-section">
              <h2>Posts</h2>
              <div className="posts-list">
                {posts.map(post => (
                  <div key={post.id} className="post-item">
                    <p>{post.content}</p>
                    <div className="post-actions">
                      <button onClick={() => handleLikePost(post.id)}>
                        Like ({post.likes || 0})
                      </button>
                      <button onClick={() => handleCommentPost(post.id)}>
                        Comment ({post.comments?.length || 0})
                      </button>
                    </div>
                    {post.comments && post.comments.length > 0 && (
                      <div className="comments-section">
                        <h4>Comments</h4>
                        {post.comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <p>{comment.content}</p>
                            <span className="comment-date">
                              {new Date(comment.createdAt.toDate()).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="articles-section">
              <h2>Articles</h2>
              <div className="articles-list">
                {articles.map(article => (
                  <div key={article.id} className="article-item">
                    <h3>{article.title}</h3>
                    <p>{article.content}</p>
                    <div className="article-actions">
                      <button onClick={() => handleLikeArticle(article.id)}>
                        Like ({article.likes || 0})
                      </button>
                      <button onClick={() => handleCommentArticle(article.id)}>
                        Comment ({article.comments?.length || 0})
                      </button>
                    </div>
                    {article.comments && article.comments.length > 0 && (
                      <div className="comments-section">
                        <h4>Comments</h4>
                        {article.comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <p>{comment.content}</p>
                            <span className="comment-date">
                              {new Date(comment.createdAt.toDate()).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="activities-section">
              <h2>Activities</h2>
              <div className="activities-list">
                {activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <p>{activity.description}</p>
                    <span className="activity-date">
                      {new Date(activity.createdAt.toDate()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'interests' && (
            <div className="interests-section">
              <h2>Interests</h2>
              <div className="interests-list">
                {interests.map(interest => (
                  <div key={interest.id} className="interest-item">
                    <span>{interest.name}</span>
                    <button onClick={() => handleRemoveInterest(interest.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
