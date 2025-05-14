import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import PostList from '../components/feed/PostList';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [mutualConnections, setMutualConnections] = useState([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [connectionId, setConnectionId] = useState(null);
  const [isSender, setIsSender] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.uid === userId;

  // Fetch user data directly from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get user document directly from Firestore
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          setError('Kullanıcı bulunamadı');
          setLoading(false);
          return;
        }
        
        const userData = userSnap.data();
        setUser({
          id: userId,
          ...userData
        });
        
        // Set profile data
        setProfile(userData.profile || {});

        // If not viewing own profile, check connection status
        if (!isOwnProfile && currentUser) {
          // Get current user's data to check connections array
          const currentUserRef = doc(db, 'users', currentUser.uid);
          const currentUserSnap = await getDoc(currentUserRef);
          
          if (currentUserSnap.exists()) {
            const currentUserData = currentUserSnap.data();
            const connections = currentUserData.connections || [];
            
            // If user is in connections, set status to accepted
            if (connections.includes(userId)) {
              setConnectionStatus('accepted');
            } else {
              // Check for pending requests
              const friendRequests = currentUserData.friendRequests || [];
              const sentRequests = currentUserData.sentFriendRequests || [];
              
              // Check if there's a request from this user
              const pendingRequest = friendRequests.find(req => req.uid === userId);
              
              if (pendingRequest) {
                setConnectionStatus('pending');
                setIsSender(false);
              } 
              // Check if we sent a request to this user
              else if (sentRequests.includes(userId)) {
                setConnectionStatus('pending');
                setIsSender(true);
              } else {
                setConnectionStatus('none');
              }
            }
            
            // Get mutual connections
            const userConnections = userData.connections || [];
            const mutual = connections.filter(id => userConnections.includes(id));
            setMutualCount(mutual.length);
            
            // Get details for first 5 mutual connections
            const mutualDetails = [];
            for (let i = 0; i < Math.min(5, mutual.length); i++) {
              const mutualUserRef = doc(db, 'users', mutual[i]);
              const mutualUserSnap = await getDoc(mutualUserRef);
              if (mutualUserSnap.exists()) {
                mutualDetails.push({
                  id: mutual[i],
                  ...mutualUserSnap.data()
                });
              }
            }
            
            setMutualConnections(mutualDetails);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError('Profil yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, isOwnProfile, currentUser]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (selectedTab === 'posts' && userId) {
        try {
          setPostsLoading(true);
          
          // Query posts collection for posts by this user
          const postsRef = collection(db, 'posts');
          const q = query(
            postsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          
          const snapshot = await getDocs(q);
          const userPosts = [];
          
          snapshot.forEach(doc => {
            const postData = doc.data();
            userPosts.push({
              id: doc.id,
              ...postData,
              imageUrl: postData.imageUrl || '',
              createdAt: postData.createdAt?.toDate()
            });
          });
          
          setPosts(userPosts);
        } catch (error) {
          console.error('Gönderiler yüklenirken hata oluştu:', error);
        } finally {
          setPostsLoading(false);
        }
      }
    };

    fetchUserPosts();
  }, [userId, selectedTab]);

  // Handle connect/disconnect
  const handleConnectionAction = async () => {
    if (!currentUser) {
      alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
      return;
    }
    
    try {
      setActionLoading(true);

      if (connectionStatus === 'none') {
        // Send connection request
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const targetUserRef = doc(db, 'users', userId);
        
        // Add to sent requests in current user's document
        await updateDoc(currentUserRef, {
          sentFriendRequests: arrayUnion(userId)
        });
        
        // Add to friend requests array in the target user document
        await updateDoc(targetUserRef, {
          friendRequests: arrayUnion({
            uid: currentUser.uid,
            status: 'pending'
          })
        });
        
        setConnectionStatus('pending');
        setIsSender(true);
        
      } else if (connectionStatus === 'pending' && isSender) {
        // Withdraw connection request
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const targetUserRef = doc(db, 'users', userId);
        
        // Remove from sent requests in current user's document
        await updateDoc(currentUserRef, {
          sentFriendRequests: arrayRemove(userId)
        });
        
        // Remove from friend requests array in target user
        await updateDoc(targetUserRef, {
          friendRequests: arrayRemove({
            uid: currentUser.uid,
            status: 'pending'
          })
        });
        
        setConnectionStatus('none');
        
      } else if (connectionStatus === 'accepted') {
        // Remove connection
        const targetUserRef = doc(db, 'users', userId);
        await updateDoc(targetUserRef, {
          connections: arrayRemove(currentUser.uid)
        });
        
        const currentUserRef = doc(db, 'users', currentUser.uid);
        await updateDoc(currentUserRef, {
          connections: arrayRemove(userId)
        });
        
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Bağlantı işlemi başarısız oldu:', error);
      alert('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle accept/reject connection request
  const handleConnectionResponse = async (accept) => {
    if (!currentUser) {
      alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
      return;
    }
    
    try {
      setActionLoading(true);

      if (connectionStatus === 'pending' && !isSender) {
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const targetUserRef = doc(db, 'users', userId);
        
        // Remove from friend requests array
        await updateDoc(currentUserRef, {
          friendRequests: arrayRemove({
            uid: userId,
            status: 'pending'
          })
        });
        
        // Remove from sent requests in target user
        await updateDoc(targetUserRef, {
          sentFriendRequests: arrayRemove(currentUser.uid)
        });
        
        if (accept) {
          // Add to connections arrays
          await updateDoc(targetUserRef, {
            connections: arrayUnion(currentUser.uid)
          });
          
          await updateDoc(currentUserRef, {
            connections: arrayUnion(userId)
          });
          
          setConnectionStatus('accepted');
        } else {
          setConnectionStatus('none');
        }
      }
    } catch (error) {
      console.error('Bağlantı yanıtı başarısız oldu:', error);
      alert('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  // Handle post update
  const handleUpdatePost = (updatedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  // Handle post delete
  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  if (loading) return <div className="loading-spinner">Profil bilgileri yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">Kullanıcı bulunamadı</div>;

  // Make sure we have arrays for these fields
  const experiences = user.experience || [];
  const educations = user.education || [];
  const skills = user.skill || [];
  const connectionCount = user.connections?.length || 0;

  return (
    <div className="user-profile-figma-bg">
      <div className="user-profile-figma-container">
        {/* Profile Main Card */}
        <div className="profile-main-card profile-header-modern">
          <div className="profile-cover-figma cover-image-modern">
            <img 
              src={profile?.cover_image || "/images/default-cover.jpg"} 
              alt="Cover" 
              onError={(e) => {e.target.src = "/images/default-cover.jpg"}}
            />
          </div>
          <div className="profile-info-figma profile-info-modern">
            <div className="profile-name-row name-section-modern">
              <span className="profile-name-figma profile-name-modern">
                {user.name || 'İsimsiz Kullanıcı'}
              </span>
              {user.role === 'employer' && (
                <span className="employer-badge">İşveren</span>
              )}
            </div>
            {user.headline && <div className="profile-headline-figma profile-headline-modern">{user.headline}</div>}
            {user.location && <div className="profile-location-figma location-modern">{user.location}</div>}
            
            <div className="profile-actions-modern">
              {isOwnProfile ? (
                <Link to="/profile/settings" className="action-button-modern primary">
                  Profili Düzenle
                </Link>
              ) : connectionStatus !== 'accepted' ? (
                <button 
                  className="action-button-modern primary"
                  onClick={handleConnectionAction}
                  disabled={actionLoading}
                >
                  {connectionStatus === 'none' && 'Bağlantı Kur'}
                  {connectionStatus === 'pending' && isSender && 'İsteği İptal Et'}
                  {connectionStatus === 'pending' && !isSender && (
                    <div className="request-actions">
                      <button onClick={() => handleConnectionResponse(true)}>Kabul Et</button>
                      <button onClick={() => handleConnectionResponse(false)}>Reddet</button>
                    </div>
                  )}
                </button>
              ) : (
                <button 
                  className="action-button-modern danger"
                  onClick={handleConnectionAction}
                  disabled={actionLoading}
                >
                  Bağlantıyı Kaldır
                </button>
              )}
              {user.email && (
                <button className="action-button-modern secondary email-button">
                  {user.email}
                </button>
              )}
            </div>
            
            <div className="connection-info">
              {connectionCount > 0 ? (
                <span>{connectionCount} bağlantı</span>
              ) : (
                <span>Henüz bağlantı yok</span>
              )}
              {mutualCount > 0 && !isOwnProfile && (
                <span className="mutual-count">• {mutualCount} ortak bağlantı</span>
              )}
            </div>
          </div>
          
          <div className="profile-photo-figma profile-picture-modern">
            <img 
              src={profile?.profile_image || "/images/default-avatar.jpg"} 
              alt={user.name || "Kullanıcı"} 
              onError={(e) => {e.target.src = "/images/default-avatar.jpg"}}
            />
          </div>
          
          {/* Tab Bar */}
          <div className="profile-tabs-bar">
            <button 
              className={`profile-tab ${selectedTab === 'posts' ? 'active' : ''}`}
              onClick={() => handleTabChange('posts')}
            >
              Gönderiler
            </button>
            <button 
              className={`profile-tab ${selectedTab === 'activity' ? 'active' : ''}`}
              onClick={() => handleTabChange('activity')}
            >
              Aktiviteler & İlgi Alanları
            </button>
            <button 
              className={`profile-tab ${selectedTab === 'articles' ? 'active' : ''}`}
              onClick={() => handleTabChange('articles')}
            >
              Makaleler
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {selectedTab === 'posts' && (
          <div className="profile-wide-card">
            <div className="tab-content">
              <PostList
                posts={posts}
                loading={postsLoading}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                isOwnProfile={isOwnProfile}
                showUser={false}
              />
              {!postsLoading && posts.length === 0 && (
                <div className="empty-section">Henüz gönderi paylaşılmamış</div>
              )}
            </div>
          </div>
        )}
        
        {selectedTab === 'activity' && (
          <div className="profile-wide-card">
            <div className="tab-content">
              {user.activity && user.activity.length > 0 ? (
                <div className="activity-list">
                  {user.activity.map((activity, index) => (
                    <div key={activity.id || index} className="activity-item">
                      <h3>{activity.title}</h3>
                      <p>{activity.description}</p>
                      {activity.date && <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section">Henüz aktivite bulunmuyor</div>
              )}
            </div>
          </div>
        )}
        
        {selectedTab === 'articles' && (
          <div className="profile-wide-card">
            <div className="tab-content">
              {user.interest && user.interest.length > 0 ? (
                <div className="interest-list">
                  {user.interest.map((interest, index) => (
                    <div key={interest.id || index} className="interest-item">
                      <h3>{interest.name}</h3>
                      {interest.description && <p>{interest.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section">Henüz ilgi alanı eklenmemiş</div>
              )}
            </div>
          </div>
        )}
        
        {/* About, Experience, Education, Skills cards only show when posts tab is active */}
        {selectedTab === 'posts' && (
          <>
            {/* About Card */}
            <div className="profile-wide-card">
              <h2 className="section-title">Hakkında</h2>
              <p className="about-text">
                {profile?.about || user?.bio || 'Kullanıcı hakkında bilgi girilmemiş.'}
              </p>
            </div>
            
            {/* Experience Card */}
            <div className="profile-wide-card">
              <h2 className="section-title">Deneyim</h2>
              {experiences && experiences.length > 0 ? (
                <div className="experience-list">
                  {experiences.map((exp, index) => (
                    <div key={exp.id || index} className="experience-mini-card">
                      <div className="experience-logo">
                        <div className="company-logo-placeholder"></div>
                      </div>
                      <div className="experience-details">
                        <h3 className="experience-title">{exp.title || 'Pozisyon'}</h3>
                        <p className="experience-company">{exp.company || 'Şirket'}</p>
                        <p className="experience-date">
                          {exp.start_date ? new Date(exp.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Başlangıç Tarihi'} -
                          {exp.is_current ? ' Halen Devam Ediyor' : exp.end_date ? ` ${new Date(exp.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}` : ' Bitiş Tarihi'}
                        </p>
                        <p className="experience-location">{exp.location || 'Konum'}</p>
                        {exp.description && <p className="experience-description">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-section">Henüz deneyim eklenmemiş.</p>
              )}
            </div>
            
            {/* Education Card */}
            <div className="profile-wide-card">
              <h2 className="section-title">Eğitim</h2>
              {educations && educations.length > 0 ? (
                <div className="education-list">
                  {educations.map((edu, index) => (
                    <div key={edu.id || index} className="education-mini-card">
                      <div className="education-logo">
                        <div className="school-logo-placeholder"></div>
                      </div>
                      <div className="education-details">
                        <h3 className="education-school">{edu.school || 'Okul'}</h3>
                        <p className="education-degree">
                          {edu.degree || 'Derece'}
                          {edu.field_of_study ? `, ${edu.field_of_study}` : ''}
                        </p>
                        <p className="education-date">
                          {edu.start_date ? new Date(edu.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : 'Başlangıç Tarihi'} -
                          {edu.is_current ? ' Halen Devam Ediyor' : edu.end_date ? ` ${new Date(edu.end_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}` : ' Bitiş Tarihi'}
                        </p>
                        {edu.description && <p className="education-description">{edu.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-section">Henüz eğitim eklenmemiş.</p>
              )}
            </div>
            
            {/* Skills Card */}
            <div className="profile-wide-card">
              <h2 className="section-title">Yetenekler</h2>
              {skills && skills.length > 0 ? (
                <div className="skills-list">
                  {skills.map((skill, index) => (
                    <div key={skill.id || index} className="skill-item">
                      <span className="skill-name">{typeof skill === 'string' ? skill : skill.name}</span>
                      {typeof skill !== 'string' && skill.endorsement_count > 0 && (
                        <span className="endorsement-count">{skill.endorsement_count}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-section">Henüz yetenek eklenmemiş.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;