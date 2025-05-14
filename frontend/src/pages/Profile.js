import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, updateProfile, uploadProfileImage, uploadCoverImage } from '../services/profile';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import ProfileHeader from '../components/profile/ProfileHeader';
import { projectService } from '../services';
import { postService } from '../services';
import './Profile.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import NewPost from '../components/feed/NewPost';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState({ section: null, id: null });
  const [formData, setFormData] = useState({
    // Experience form
    experience: { title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' },
    // Education form
    education: { school: '', degree: '', field_of_study: '', start_date: '', end_date: '', is_current: false, description: '' },
    // Skill form
    skill: { name: '', company: '' },
    // Activity form
    activity: { title: '', description: '', date: '' },
    // Interest form
    interest: { name: '', description: '' }
  });
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', imageFile: null });
  const [projectError, setProjectError] = useState('');
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postForm, setPostForm] = useState({ content: '', image: null, hashtags: [] });
  const [postError, setPostError] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articleForm, setArticleForm] = useState({ title: '', content: '' });
  const [articleError, setArticleError] = useState('');
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        setProjectsLoading(true);
        try {
          const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProjects(data);
        } catch (e) {
          setProjectError('Failed to load projects.');
        } finally {
          setProjectsLoading(false);
        }
      }
    };
    fetchProjects();
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (user) {
        setPostsLoading(true);
        try {
          const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPosts(data);
        } catch (err) {
          setPostError('Postlar yüklenemedi.');
        }
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (user) {
        setArticlesLoading(true);
        try {
          const q = query(collection(db, 'articles'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setArticles(data);
        } catch (err) {
          setArticleError('Articles yüklenemedi.');
        }
        setArticlesLoading(false);
      }
    };
    fetchArticles();
  }, [user]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadProfileImage(file);
      setProfile(prev => ({
        ...prev,
        profile: { ...prev.profile, profile_image: url }
      }));
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadCoverImage(file);
      setProfile(prev => ({
        ...prev,
        profile: { ...prev.profile, cover_image: url }
      }));
    }
  };

  const handleFieldChange = (field, value) => {
    if (["about", "profile_image", "cover_image"].includes(field)) {
      setProfile(prev => ({
        ...prev,
        profile: { ...prev.profile, [field]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile(profile);
    alert('Profile updated!');
  };

  const handleProjectInput = (e) => {
    const { name, value, files } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setProjectSubmitting(true);
    setProjectError('');
    try {
      // Firestore'a kaydet
      const projectRef = await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: projectForm.title,
        description: projectForm.description,
        imageUrl: projectForm.imageFile ? await uploadProjectImage(projectForm.imageFile) : '',
        createdAt: new Date()
      });
      setProjectForm({ title: '', description: '', imageFile: null });
      // Yeniden yükle
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    } catch (e) {
      setProjectError('Failed to add project.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handlePostInputChange = (e) => {
    const { name, value, files } = e.target;
    setPostForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSubmitting(true);
    try {
      await postService.createPost(user.uid, {
        content: postForm.content,
        image: postForm.image,
      });
      setPostForm({ content: '', image: null });
      // Yeniden yükle
      const data = await postService.getUserPosts(user.uid);
      setPosts(data);
    } catch (err) {
      setPostError('Post paylaşılırken hata oluştu.');
    }
    setPostSubmitting(false);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err) {
        setPostError('Failed to delete post.');
      }
    }
  };

  const handleInputChange = (e, section) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleAddItem = async (section) => {
    try {
      let newItem = { ...formData[section], id: Date.now().toString() };
      if (section === 'skill') {
        newItem = { name: formData.skill.name, company: formData.skill.company, id: Date.now().toString() };
      }
      const updatedItems = [...(profile[section] || []), newItem];
      await updateDoc(doc(db, 'users', user.uid), {
        [section]: updatedItems
      });
      setProfile(prev => ({
        ...prev,
        [section]: updatedItems
      }));
      setFormData(prev => ({
        ...prev,
        [section]: getEmptyFormData(section)
      }));
      setEditingSection(null);
    } catch (error) {
      console.error(`Error adding ${section}:`, error);
    }
  };

  const handleDeleteItem = async (section, itemId) => {
    try {
      const updatedItems = profile[section].filter(item => item.id !== itemId);
      
      await updateDoc(doc(db, 'users', user.uid), {
        [section]: updatedItems
      });

      setProfile(prev => ({
        ...prev,
        [section]: updatedItems
      }));
    } catch (error) {
      console.error(`Error deleting ${section}:`, error);
    }
  };

  const getEmptyFormData = (section) => {
    switch (section) {
      case 'experience':
        return { title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' };
      case 'education':
        return { school: '', degree: '', field_of_study: '', start_date: '', end_date: '', is_current: false, description: '' };
      case 'skill':
        return { name: '', company: '' };
      case 'activity':
        return { title: '', description: '', date: '' };
      case 'interest':
        return { name: '', description: '' };
      default:
        return {};
    }
  };

  // Skill formda iş yeri seçimi için experiences'dan company'leri al
  const companyOptions = (profile?.experience || [])
    .map(exp => exp.company)
    .filter((c, i, arr) => c && arr.indexOf(c) === i);

  // Proje görseli yükleme fonksiyonu
  async function uploadProjectImage(file) {
    const storageRef = ref(storage, `projects/${user.uid}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Post görseli yükleme fonksiyonu
  async function uploadPostImage(file) {
    const storageRef = ref(storage, `posts/${user.uid}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  const handleArticleInput = (e) => {
    const { name, value } = e.target;
    setArticleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    setArticleSubmitting(true);
    setArticleError('');
    try {
      await addDoc(collection(db, 'articles'), {
        userId: user.uid,
        title: articleForm.title,
        content: articleForm.content,
        createdAt: new Date()
      });
      setArticleForm({ title: '', content: '' });
      // Yeniden yükle
      const q = query(collection(db, 'articles'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(data);
    } catch (e) {
      setArticleError('Failed to add article.');
    } finally {
      setArticleSubmitting(false);
    }
  };

  // Edit butonuna tıklanınca formu aç
  const handleEditItem = (section, item) => {
    setEditingSection(section);
    setEditingItem({ section, id: item.id });
    setFormData(prev => ({ ...prev, [section]: { ...item } }));
  };

  // Güncelleme fonksiyonu
  const handleUpdateItem = async (section) => {
    try {
      const updatedItems = profile[section].map(item =>
        item.id === formData[section].id ? { ...formData[section] } : item
      );
      await updateDoc(doc(db, 'users', user.uid), {
        [section]: updatedItems
      });
      setProfile(prev => ({ ...prev, [section]: updatedItems }));
      setFormData(prev => ({ ...prev, [section]: getEmptyFormData(section) }));
      setEditingSection(null);
      setEditingItem({ section: null, id: null });
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
    }
  };

  // Article silme fonksiyonu
  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (e) {
      setArticleError('Failed to delete article.');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      imageFile: null
    });
    setEditingSection('project');
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setProjectSubmitting(true);
    setProjectError('');
    try {
      const projectRef = doc(db, 'projects', editingProject.id);
      const updateData = {
        title: projectForm.title,
        description: projectForm.description,
        updatedAt: new Date()
      };
      
      if (projectForm.imageFile) {
        updateData.imageUrl = await uploadProjectImage(projectForm.imageFile);
      }
      
      await updateDoc(projectRef, updateData);
      
      // Refresh projects list
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      
      setProjectForm({ title: '', description: '', imageFile: null });
      setEditingProject(null);
      setEditingSection(null);
    } catch (e) {
      setProjectError('Failed to update project.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (e) {
        setProjectError('Failed to delete project.');
      }
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostForm({
      content: post.content,
      image: null,
      hashtags: post.hashtags || []
    });
    setEditingSection('post');
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSubmitting(true);
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      const updateData = {
        content: postForm.content,
        updatedAt: new Date()
      };
      
      // Include hashtags in update data
      if (postForm.hashtags && postForm.hashtags.length > 0) {
        updateData.hashtags = postForm.hashtags;
      }
      
      if (postForm.image) {
        updateData.imageUrl = await uploadPostImage(postForm.image);
      }
      
      await updateDoc(postRef, updateData);
      
      // Refresh posts list
      const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      
      setPostForm({ content: '', image: null, hashtags: [] });
      setEditingPost(null);
      setEditingSection(null);
    } catch (err) {
      setPostError('Failed to update post.');
    }
    setPostSubmitting(false);
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content
    });
    setEditingSection('article');
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    setArticleSubmitting(true);
    setArticleError('');
    try {
      const articleRef = doc(db, 'articles', editingArticle.id);
      await updateDoc(articleRef, {
        title: articleForm.title,
        content: articleForm.content,
        updatedAt: new Date()
      });
      
      // Refresh articles list
      const q = query(collection(db, 'articles'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(data);
      
      setArticleForm({ title: '', content: '' });
      setEditingArticle(null);
      setEditingSection(null);
    } catch (e) {
      setArticleError('Failed to update article.');
    } finally {
      setArticleSubmitting(false);
    }
  };

  // Only NewPost for adding posts
  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  if (loading) {
    return <div className="loading-indicator">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <ProfileHeader 
        profile={profile}
        onProfileImageChange={handleProfileImageChange}
        onCoverImageChange={handleCoverImageChange}
        onFieldChange={handleFieldChange}
        onSaveProfile={handleSaveProfile}
      />

      <div className="profile-tabs-bar">
        <button 
          className={`profile-tab ${selectedTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          Profile
        </button>
        <button 
          className={`profile-tab ${selectedTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          Activity & Interests
        </button>
        <button 
          className={`profile-tab ${selectedTab === 'articles' ? 'active' : ''}`}
          onClick={() => handleTabChange('articles')}
        >
          Articles
        </button>
      </div>

      <div className="profile-main-content">
        {selectedTab === 'profile' && (
          <>
            {/* About Section */}
            <div className="profile-section-card">
              <h2 className="profile-section-title">About</h2>
              <div className="profile-section-content">
                <p>{profile?.bio || <span className="profile-empty">No bio available.</span>}</p>
              </div>
            </div>

            {/* Experience Section */}
            <div className="profile-section-card">
              <div className="section-header">
              <h2 className="profile-section-title">Experience</h2>
                <button 
                  className="add-button"
                  onClick={() => setEditingSection(editingSection === 'experience' ? null : 'experience')}
                >
                  {editingSection === 'experience' ? 'Cancel' : 'Add Experience'}
                </button>
              </div>
              
              {editingSection === 'experience' && (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); editingItem.id ? handleUpdateItem('experience') : handleAddItem('experience'); }}>
                  <input
                    type="text"
                    name="title"
                    value={formData.experience.title}
                    onChange={(e) => handleInputChange(e, 'experience')}
                    placeholder="Title"
                    required
                  />
                  <input
                    type="text"
                    name="company"
                    value={formData.experience.company}
                    onChange={(e) => handleInputChange(e, 'experience')}
                    placeholder="Company"
                    required
                  />
                  <input
                    type="text"
                    name="location"
                    value={formData.experience.location}
                    onChange={(e) => handleInputChange(e, 'experience')}
                    placeholder="Location"
                  />
                  <div className="date-inputs">
                    <input
                      type="date"
                      name="start_date"
                      value={formData.experience.start_date}
                      onChange={(e) => handleInputChange(e, 'experience')}
                      required
                    />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.experience.end_date}
                      onChange={(e) => handleInputChange(e, 'experience')}
                      disabled={formData.experience.is_current}
                    />
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_current"
                      checked={formData.experience.is_current}
                      onChange={(e) => handleInputChange(e, 'experience')}
                    />
                    I currently work here
                  </label>
                  <textarea
                    name="description"
                    value={formData.experience.description}
                    onChange={(e) => handleInputChange(e, 'experience')}
                    placeholder="Description"
                    rows="3"
                  />
                  <button type="submit" className="save-button">{editingItem.id ? 'Update Experience' : 'Add Experience'}</button>
                </form>
              )}

              <div className="profile-section-content">
                {profile?.experience?.length > 0 ? (
                  profile.experience.map(exp => (
                    <div key={exp.id} className="profile-mini-card experience-mini-card">
                      <button
                        className="edit-button-mini"
                        title="Edit"
                        onClick={() => handleEditItem('experience', exp)}
                        style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-button"
                        title="Delete"
                        onClick={() => handleDeleteItem('experience', exp.id)}
                        style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px'}}
                      >
                        ×
                      </button>
                      <div className="mini-card-details">
                        <h3 className="mini-card-title">{exp.title}</h3>
                        <p className="mini-card-company">{exp.company}</p>
                        <p className="mini-card-date">
                          {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                          {exp.is_current ? ' - Present' : exp.end_date ? ` - ${new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                        </p>
                        <p className="mini-card-location">{exp.location}</p>
                        {exp.description && <p className="mini-card-description">{exp.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="profile-empty">No experience added yet.</div>
                )}
              </div>
            </div>

            {/* Education Section */}
            <div className="profile-section-card">
              <div className="section-header">
              <h2 className="profile-section-title">Education</h2>
                <button 
                  className="add-button"
                  onClick={() => setEditingSection(editingSection === 'education' ? null : 'education')}
                >
                  {editingSection === 'education' ? 'Cancel' : 'Add Education'}
                </button>
              </div>

              {editingSection === 'education' && (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); editingItem.id ? handleUpdateItem('education') : handleAddItem('education'); }}>
                  <input
                    type="text"
                    name="school"
                    value={formData.education.school}
                    onChange={(e) => handleInputChange(e, 'education')}
                    placeholder="School"
                    required
                  />
                  <input
                    type="text"
                    name="degree"
                    value={formData.education.degree}
                    onChange={(e) => handleInputChange(e, 'education')}
                    placeholder="Degree"
                    required
                  />
                  <input
                    type="text"
                    name="field_of_study"
                    value={formData.education.field_of_study}
                    onChange={(e) => handleInputChange(e, 'education')}
                    placeholder="Field of Study"
                  />
                  <div className="date-inputs">
                    <input
                      type="date"
                      name="start_date"
                      value={formData.education.start_date}
                      onChange={(e) => handleInputChange(e, 'education')}
                      required
                    />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.education.end_date}
                      onChange={(e) => handleInputChange(e, 'education')}
                      disabled={formData.education.is_current}
                    />
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_current"
                      checked={formData.education.is_current}
                      onChange={(e) => handleInputChange(e, 'education')}
                    />
                    I currently study here
                  </label>
                  <textarea
                    name="description"
                    value={formData.education.description}
                    onChange={(e) => handleInputChange(e, 'education')}
                    placeholder="Description"
                    rows="3"
                  />
                  <button type="submit" className="save-button">{editingItem.id ? 'Update Education' : 'Add Education'}</button>
                </form>
              )}

              <div className="profile-section-content">
                {profile?.education?.length > 0 ? (
                  profile.education.map(edu => (
                    <div key={edu.id} className="profile-mini-card education-mini-card">
                      <button
                        className="edit-button-mini"
                        title="Edit"
                        onClick={() => handleEditItem('education', edu)}
                        style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-button"
                        title="Delete"
                        onClick={() => handleDeleteItem('education', edu.id)}
                        style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px'}}
                      >
                        ×
                      </button>
                      <div className="mini-card-details">
                        <h3 className="mini-card-title">{edu.school}</h3>
                        <p className="mini-card-degree">{edu.degree}{edu.field_of_study ? `, ${edu.field_of_study}` : ''}</p>
                        <p className="mini-card-date">
                          {edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                          {edu.is_current ? ' - Present' : edu.end_date ? ` - ${new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}
                        </p>
                        {edu.description && <p className="mini-card-description">{edu.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="profile-empty">No education added yet.</div>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="profile-section-card">
              <div className="section-header">
              <h2 className="profile-section-title">Skills</h2>
                <button 
                  className="add-button"
                  onClick={() => setEditingSection(editingSection === 'skill' ? null : 'skill')}
                >
                  {editingSection === 'skill' ? 'Cancel' : 'Add Skill'}
                </button>
              </div>

              {editingSection === 'skill' && (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); editingItem.id ? handleUpdateItem('skill') : handleAddItem('skill'); }}>
                  <input
                    type="text"
                    name="name"
                    value={formData.skill.name}
                    onChange={(e) => handleInputChange(e, 'skill')}
                    placeholder="Skill name"
                    required
                  />
                  <select
                    name="company"
                    value={formData.skill.company || ''}
                    onChange={(e) => handleInputChange(e, 'skill')}
                  >
                    <option value="">Select company (optional)</option>
                    {companyOptions.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                  <button type="submit" className="save-button">{editingItem.id ? 'Update Skill' : 'Add Skill'}</button>
                </form>
              )}

              <div className="profile-section-content skills-section-content">
                {profile?.skill?.length > 0 ? (
                  <div className="skills-list">
                    {profile.skill.map(skill => (
                      <div key={skill.id} className="skill-card" style={{ position: 'relative', paddingRight: '40px' }}>
                        <button
                          className="delete-button"
                          title="Delete"
                          onClick={() => handleDeleteItem('skill', skill.id)}
                          style={{ fontWeight: 'bold', fontSize: '16px', position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#d11124', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                        <span className="skill-name">{skill.name}</span>
                        {skill.company && (
                          <span className="skill-company">({skill.company})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty">No skills added yet.</div>
                )}
              </div>
            </div>

            {/* Projects Section */}
            <div className="profile-section-card">
              <div className="section-header">
              <h2 className="profile-section-title">Projects</h2>
                <button 
                  className="add-button"
                  onClick={() => {
                    setEditingSection(editingSection === 'project' ? null : 'project');
                    setEditingProject(null);
                    setProjectForm({ title: '', description: '', imageFile: null });
                  }}
                >
                  {editingSection === 'project' ? 'Cancel' : 'Add Project'}
                </button>
              </div>
              <div className="profile-section-content">
                {editingSection === 'project' && (
                  <form className="project-form" onSubmit={editingProject ? handleUpdateProject : handleAddProject}>
                  <input
                    type="text"
                    name="title"
                    placeholder="Project title"
                    value={projectForm.title}
                    onChange={handleProjectInput}
                    required
                    className="project-input"
                    disabled={projectSubmitting}
                  />
                  <textarea
                    name="description"
                    placeholder="Project description"
                    value={projectForm.description}
                    onChange={handleProjectInput}
                    required
                    className="project-input"
                    disabled={projectSubmitting}
                  />
                  <input
                    type="file"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleProjectInput}
                    className="project-input"
                    disabled={projectSubmitting}
                  />
                  <button type="submit" className="project-btn" disabled={projectSubmitting}>
                      {projectSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
                  </button>
                  {projectError && <div className="project-error">{projectError}</div>}
                </form>
                )}
                {projectsLoading ? (
                  <div className="profile-empty">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="profile-empty">No projects added yet.</div>
                ) : (
                  <div className="projects-list">
                    {projects.map(project => (
                      <div key={project.id} className="project-card">
                        <button
                          className="edit-button-mini"
                          title="Edit"
                          onClick={() => handleEditProject(project)}
                          style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                        >
                          ✎
                        </button>
                        <button 
                          className="delete-button"
                          title="Delete"
                          onClick={() => handleDeleteProject(project.id)}
                          style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px'}}
                        >
                          ×
                        </button>
                        {project.imageUrl && <img src={project.imageUrl} alt={project.title} className="project-image" />}
                        <div className="project-info">
                          <h3 className="project-title">{project.title}</h3>
                          <p className="project-description">{project.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

        {/* Posts Section */}
        <div className="profile-section-card">
              <div className="section-header">
          <h2 className="profile-section-title">Posts</h2>
                {/* Remove Create Post button here, do not render it */}
              </div>
          <div className="profile-section-content">
                <NewPost onPostCreated={handlePostCreated} />
            {postsLoading ? (
              <div className="profile-empty">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="profile-empty">No posts shared yet.</div>
            ) : (
              <div className="posts-list">
                {posts.map(post => (
                  <div key={post.id} className="post-card" style={{ position: 'relative', padding: 0 }}>
                    <div className="post-header" style={{ padding: '16px 16px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="post-author" style={{ fontWeight: 600, color: '#0a66c2' }}>You</div>
                      <div className="post-actions">
                        <button
                          className="edit-button-mini"
                          title="Edit"
                          onClick={() => handleEditPost(post)}
                          style={{ fontWeight: 'bold', fontSize: '15px', padding: '0 8px', background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer' }}
                        >
                          ✎
                        </button>
                        <button
                          className="delete-post-btn"
                          title="Delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {(post.imageUrl || post.image_url || post.image) && (
                      <div style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>
                        <img
                          src={post.imageUrl || post.image_url || post.image}
                          alt="Post"
                          className="post-image"
                          style={{
                            maxWidth: '96%',
                            maxHeight: 320,
                            borderRadius: 12,
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
                          }}
                        />
                      </div>
                    )}
                    <div className="post-content-text" style={{ padding: '16px', fontSize: 17, color: '#222', wordBreak: 'break-word' }}>{post.content}</div>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="post-hashtags" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 16px 16px', marginTop: -8 }}>
                        {post.hashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="post-hashtag"
                          >
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ padding: '0 16px 16px 16px', color: '#888', fontSize: 15 }}>
                      <span>Beğeni: {post.likes_count || 0}</span>
                    </div>
                    {/* Düzenleme formu */}
                    {editingPost && editingPost.id === post.id && editingSection === 'post' && (
                      <form className="edit-form" onSubmit={handleUpdatePost} style={{ margin: 16 }}>
                        <textarea
                          name="content"
                          value={postForm.content}
                          onChange={e => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="İçerik"
                          rows="3"
                          required
                        />
                        
                        <div className="hashtags-edit-container">
                          <label>Hashtag'ler:</label>
                          <div className="hashtags-edit-list">
                            {postForm.hashtags && postForm.hashtags.map((hashtag, index) => (
                              <div key={index} className="hashtag-edit-item">
                                <span>{hashtag}</span>
                                <button 
                                  type="button" 
                                  className="remove-hashtag-btn"
                                  onClick={() => setPostForm(prev => ({
                                    ...prev,
                                    hashtags: prev.hashtags.filter((_, i) => i !== index)
                                  }))}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="hashtag-add-container">
                            <input
                              type="text"
                              placeholder="Yeni hashtag ekle (# işareti ile başlayarak)"
                              value={postForm.newHashtag || ''}
                              onChange={e => setPostForm(prev => ({ ...prev, newHashtag: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (postForm.newHashtag && postForm.newHashtag.trim()) {
                                    const tag = postForm.newHashtag.trim().startsWith('#') 
                                      ? postForm.newHashtag.trim() 
                                      : `#${postForm.newHashtag.trim()}`;
                                    
                                    if (!postForm.hashtags.includes(tag)) {
                                      setPostForm(prev => ({
                                        ...prev,
                                        hashtags: [...prev.hashtags, tag],
                                        newHashtag: ''
                                      }));
                                    }
                                  }
                                }
                              }}
                              className="hashtag-input"
                            />
                            <button 
                              type="button" 
                              className="add-hashtag-btn"
                              onClick={() => {
                                if (postForm.newHashtag && postForm.newHashtag.trim()) {
                                  const tag = postForm.newHashtag.trim().startsWith('#') 
                                    ? postForm.newHashtag.trim() 
                                    : `#${postForm.newHashtag.trim()}`;
                                  
                                  if (!postForm.hashtags.includes(tag)) {
                                    setPostForm(prev => ({
                                      ...prev,
                                      hashtags: [...prev.hashtags, tag],
                                      newHashtag: ''
                                    }));
                                  }
                                }
                              }}
                            >
                              Ekle
                            </button>
                          </div>
                        </div>
                        
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={e => setPostForm(prev => ({ ...prev, image: e.target.files[0] }))}
                        />
                        <button type="submit" className="save-button" disabled={postSubmitting}>
                          {postSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button type="button" className="add-button" style={{ marginLeft: 8 }} onClick={() => { setEditingPost(null); setEditingSection(null); }}>
                          İptal
                        </button>
                        {postError && <div className="post-error">{postError}</div>}
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}
        {selectedTab === 'activity' && (
          <>
            {/* Activities Section */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="profile-section-title">Activities</h2>
                <button 
                  className="add-button"
                  onClick={() => setEditingSection(editingSection === 'activity' ? null : 'activity')}
                >
                  {editingSection === 'activity' ? 'Cancel' : 'Add Activity'}
                </button>
              </div>

              {editingSection === 'activity' && (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); editingItem.id ? handleUpdateItem('activity') : handleAddItem('activity'); }}>
                  <input
                    type="text"
                    name="title"
                    value={formData.activity.title}
                    onChange={(e) => handleInputChange(e, 'activity')}
                    placeholder="Activity title"
                    required
                  />
                  <input
                    type="date"
                    name="date"
                    value={formData.activity.date}
                    onChange={(e) => handleInputChange(e, 'activity')}
                    required
                  />
                  <textarea
                    name="description"
                    value={formData.activity.description}
                    onChange={(e) => handleInputChange(e, 'activity')}
                    placeholder="Activity description"
                    rows="3"
                  />
                  <button type="submit" className="save-button">{editingItem.id ? 'Update Activity' : 'Add Activity'}</button>
                </form>
              )}

              <div className="profile-section-content">
                {profile?.activity?.length > 0 ? (
                  profile.activity.map(activity => (
                    <div key={activity.id} className="profile-mini-card activity-mini-card">
                      <button
                        className="edit-button-mini"
                        title="Edit"
                        onClick={() => handleEditItem('activity', activity)}
                        style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-button"
                        title="Delete"
                        onClick={() => handleDeleteItem('activity', activity.id)}
                        style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px'}}
                      >
                        ×
                      </button>
                      <div className="mini-card-details">
                        <h3 className="mini-card-title">{activity.title}</h3>
                        <p className="mini-card-date">
                          {activity.date ? new Date(activity.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </p>
                        {activity.description && <p className="mini-card-description">{activity.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="profile-empty">No activities added yet.</div>
                )}
              </div>
            </div>

            {/* Interests Section */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="profile-section-title">Interests</h2>
                <button 
                  className="add-button"
                  onClick={() => setEditingSection(editingSection === 'interest' ? null : 'interest')}
                >
                  {editingSection === 'interest' ? 'Cancel' : 'Add Interest'}
                </button>
              </div>

              {editingSection === 'interest' && (
                <form className="edit-form" onSubmit={(e) => { e.preventDefault(); editingItem.id ? handleUpdateItem('interest') : handleAddItem('interest'); }}>
                  <input
                    type="text"
                    name="name"
                    value={formData.interest.name}
                    onChange={(e) => handleInputChange(e, 'interest')}
                    placeholder="Interest name"
                    required
                  />
                  <textarea
                    name="description"
                    value={formData.interest.description}
                    onChange={(e) => handleInputChange(e, 'interest')}
                    placeholder="Interest description"
                    rows="3"
                  />
                  <button type="submit" className="save-button">{editingItem.id ? 'Update Interest' : 'Add Interest'}</button>
                </form>
              )}

              <div className="profile-section-content">
                {profile?.interest?.length > 0 ? (
                  profile.interest.map(interest => (
                    <div key={interest.id} className="profile-mini-card interest-mini-card">
                      <button
                        className="edit-button-mini"
                        title="Edit"
                        onClick={() => handleEditItem('interest', interest)}
                        style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-button"
                        title="Delete"
                        onClick={() => handleDeleteItem('interest', interest.id)}
                        style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px'}}
                      >
                        ×
                      </button>
                      <div className="mini-card-details">
                        <h3 className="mini-card-title">{interest.name}</h3>
                        {interest.description && <p className="mini-card-description">{interest.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="profile-empty">No interests added yet.</div>
                )}
              </div>
            </div>
          </>
        )}
        {selectedTab === 'articles' && (
          <div className="profile-section-card">
            <h2 className="profile-section-title">Articles</h2>
            <div className="profile-section-content">
              <form className="edit-form" onSubmit={editingArticle ? handleUpdateArticle : handleAddArticle}>
                <input
                  type="text"
                  name="title"
                  placeholder="Article title"
                  value={articleForm.title}
                  onChange={handleArticleInput}
                  required
                />
                <textarea
                  name="content"
                  placeholder="Article content"
                  value={articleForm.content}
                  onChange={handleArticleInput}
                  rows="4"
                  required
                />
                <button type="submit" className="save-button" disabled={articleSubmitting}>
                  {articleSubmitting ? 'Saving...' : editingArticle ? 'Update Article' : 'Add Article'}
                </button>
                {articleError && <div className="project-error">{articleError}</div>}
              </form>
              {articlesLoading ? (
                <div className="profile-empty">Loading articles...</div>
              ) : articles.length === 0 ? (
                <div className="profile-empty">No articles to show yet.</div>
              ) : (
                <div className="articles-list">
                  {articles.map(article => (
                    <div key={article.id} className="article-item" style={{position: 'relative'}}>
                      <button
                        className="edit-button-mini"
                        title="Edit"
                        onClick={() => handleEditArticle(article)}
                        style={{fontWeight: 'bold', fontSize: '15px', padding: '0 8px', position: 'absolute', top: 8, right: 36, background: 'none', border: 'none', color: '#0075B1', cursor: 'pointer'}}
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-button"
                        title="Delete"
                        onClick={() => handleDeleteArticle(article.id)}
                        style={{fontWeight: 'bold', fontSize: '16px', padding: '0 8px', position: 'absolute', top: 8, right: 8}}
                      >
                        ×
                      </button>
                      <h3>{article.title}</h3>
                      <p>{article.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;