import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService, pageService, hashtagService, teammateService, teamService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { FaLink, FaBell, FaUsers, FaLayerGroup, FaHashtag } from 'react-icons/fa';
import './Network.css';
import { collection, query, getDocs, where, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Box, Grid, Typography, Container, CircularProgress, Alert, Card, CardContent, Avatar, Button, TextField } from '@mui/material';
import UserCard from '../components/UserCard';
import FriendRequests from '../components/FriendRequests';
import { useConnection } from '../contexts/ConnectionContext';

const Network = () => {
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('connections');
  const [requestsCount, setRequestsCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [followedPages, setFollowedPages] = useState([]);
  const [newPageName, setNewPageName] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [followedHashtags, setFollowedHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [teammates, setTeammates] = useState([]);
  const [teammateInvites, setTeammateInvites] = useState([]);
  const [inviteUserId, setInviteUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const defaultProfileImage = '/default-avatar.jpg';
  const [error, setError] = useState(null);
  const { connections, setConnections, updateConnectionCount } = useConnection();
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Fetch all users except current user and already connected users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user');
        setError('Please login to view users');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get current user's data including connections and sent requests
        const currentUserRef = doc(db, 'users', auth.currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);
        
        if (!currentUserDoc.exists()) {
          console.log('Current user document not found in Firestore');
          // Create user document if it doesn't exist
          const userData = {
            name: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            profile: {
              profile_image: '',
              cover_image: '',
              about: ''
            },
            connections: [],
            sentFriendRequests: [],
            friendRequests: []
          };
          await updateDoc(currentUserRef, userData);
        }

        const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
        const connections = currentUserData?.connections || [];
        setConnections(connections);
        
        // Fetch connection details
        const connectionPromises = connections.map(async (connectionId) => {
          const userDoc = await getDoc(doc(db, 'users', connectionId));
          if (userDoc.exists()) {
            return {
              id: connectionId,
              ...userDoc.data()
            };
          }
          return null;
        });
        
        const connectionDetails = await Promise.all(connectionPromises);
        const validConnections = connectionDetails.filter(Boolean);
        
        // Get sent friend requests
        const sentFriendRequests = currentUserData?.sentFriendRequests || [];
        setSentRequests(sentFriendRequests);

        // Query all users
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const usersData = [];
        querySnapshot.forEach((doc) => {
          // Skip current user and already connected users
          if (doc.id !== auth.currentUser.uid && !connections.includes(doc.id)) {
            const userData = doc.data();
            usersData.push({
              id: doc.id,
              ...userData,
              isRequestSent: sentFriendRequests.includes(doc.id)
            });
          }
        });
        
        // Combine connection details with other users
        setUsers([...validConnections, ...usersData]);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedTab === 'connections') {
      fetchUsers();
    }
  }, [selectedTab]);

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const response = await connectionService.getConnections();
        setConnections(response.items);
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  // Fetch connection requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        const response = await connectionService.getConnectionRequests();
        setRequests(response.items);
        setRequestsCount(response.total);
      } catch (error) {
        console.error('Failed to fetch connection requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        const response = await connectionService.getConnectionSuggestions();
        setSuggestions(response.items);
      } catch (error) {
        console.error('Failed to fetch connection suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  // Pages
  useEffect(() => {
    if (selectedTab === 'pages') {
      pageService.getUserPages().then(setPages);
      pageService.getFollowedPages().then(setFollowedPages);
    }
  }, [selectedTab]);

  // Hashtags
  useEffect(() => {
    if (selectedTab === 'hashtags') {
      hashtagService.getHashtags().then(setHashtags);
      hashtagService.getFollowedHashtags().then(setFollowedHashtags);
    }
  }, [selectedTab]);

  // Teammates
  useEffect(() => {
    if (selectedTab === 'teammates') {
      teammateService.getTeammates().then(setTeammates);
      teammateService.getTeammateInvites().then(setTeammateInvites);
    }
  }, [selectedTab]);

  // Fetch friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const currentUserRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(currentUserRef);
        
        if (userDoc.exists()) {
          const requests = userDoc.data().friendRequests || [];
          setFriendRequests(requests);
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    if (auth.currentUser) {
      fetchFriendRequests();
    }
  }, []);

  // Handle connect
  const handleConnect = async (userId) => {
    try {
      setActionLoading(true);
      await connectionService.createConnectionRequest(userId);

      // Remove from suggestions
      setSuggestions(prevSuggestions =>
        prevSuggestions.filter(suggestion => suggestion.id !== userId)
      );
    } catch (error) {
      console.error('Failed to send connection request:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle accept request
  const handleAcceptRequest = async (requestUid) => {
    try {
      setActionLoading(true);
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const requestUserRef = doc(db, 'users', requestUid);

      // Get the request to remove
      const currentUserDoc = await getDoc(currentUserRef);
      const friendRequests = currentUserDoc.data()?.friendRequests || [];
      const requestToRemove = friendRequests.find(req => req.uid === requestUid);

      if (requestToRemove) {
        // Remove the request
        await updateDoc(currentUserRef, {
          friendRequests: arrayRemove(requestToRemove),
          connections: arrayUnion(requestUid)
        });

        // Add to requester's connections
        await updateDoc(requestUserRef, {
          connections: arrayUnion(auth.currentUser.uid)
        });

        // Update local states
        setFriendRequests(prev => prev.filter(req => req.uid !== requestUid));
        
        // Update global connection count
        await updateConnectionCount();
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle ignore request
  const handleIgnoreRequest = async (connectionId) => {
    try {
      setActionLoading(true);
      await connectionService.deleteConnection(connectionId);

      // Remove from requests
      setRequests(prevRequests => prevRequests.filter(request => request.id !== connectionId));
      setRequestsCount(prevCount => prevCount - 1);
    } catch (error) {
      console.error('Failed to ignore connection request:', error);
      alert('Failed to ignore connection request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove connection
  const handleRemoveConnection = async (connectionId) => {
    try {
      setActionLoading(true);
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const connectionUserRef = doc(db, 'users', connectionId);

      // Remove from both users' connections
      await updateDoc(currentUserRef, {
        connections: arrayRemove(connectionId)
      });
      await updateDoc(connectionUserRef, {
        connections: arrayRemove(auth.currentUser.uid)
      });

      // Update local state
      setConnections(prev => prev.filter(id => id !== connectionId));
      
      // Update global connection count
      await updateConnectionCount();

    } catch (error) {
      console.error('Failed to remove connection:', error);
      alert('Failed to remove connection. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  // Pages
  const handleCreatePage = async () => {
    if (!newPageName) return;
    try {
      await pageService.createPage({ name: newPageName });
      setNewPageName('');
      // Refresh pages list
      const userPages = await pageService.getUserPages();
      setPages(userPages);
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Failed to create page. Please try again.');
    }
  };

  const handleFollowPage = async (pageId) => {
    await pageService.followPage(pageId);
    setFollowedPages(await pageService.getFollowedPages());
  };

  const handleUnfollowPage = async (userPageId) => {
    await pageService.unfollowPage(userPageId);
    setFollowedPages(await pageService.getFollowedPages());
  };

  // Hashtags
  const handleCreateHashtag = async () => {
    if (!newHashtag) return;
    await hashtagService.createHashtag({ name: newHashtag });
    setNewHashtag('');
    setHashtags(await hashtagService.getHashtags());
  };

  const handleFollowHashtag = async (hashtagId) => {
    await hashtagService.followHashtag(hashtagId);
    setFollowedHashtags(await hashtagService.getFollowedHashtags());
  };

  const handleUnfollowHashtag = async (userHashtagId) => {
    await hashtagService.unfollowHashtag(userHashtagId);
    setFollowedHashtags(await hashtagService.getFollowedHashtags());
  };

  // Teammates
  const handleSendTeammateInvite = async () => {
    if (!inviteUserId) return;
    await teammateService.sendTeammateInvite(inviteUserId);
    setInviteUserId('');
    setTeammateInvites(await teammateService.getTeammateInvites());
  };

  const handleAcceptTeammateInvite = async (inviteId) => {
    await teammateService.acceptTeammateInvite(inviteId);
    setTeammateInvites(await teammateService.getTeammateInvites());
    setTeammates(await teammateService.getTeammates());
  };

  const handleRejectTeammateInvite = async (inviteId) => {
    await teammateService.rejectTeammateInvite(inviteId);
    setTeammateInvites(await teammateService.getTeammateInvites());
  };

  const handleRemoveTeammate = async (teammateId) => {
    await teammateService.removeTeammate(teammateId);
    setTeammates(await teammateService.getTeammates());
  };

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      const targetUserRef = doc(db, 'users', targetUserId);
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current user's data
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();

      // Add friend request to target user's friendRequests
      await updateDoc(targetUserRef, {
        friendRequests: arrayUnion({
          uid: auth.currentUser.uid,
          name: currentUserData.name,
          profile_image: currentUserData.profile?.profile_image || '/default-avatar.jpg',
          headline: currentUserData.headline,
          status: 'pending',
          timestamp: new Date().toISOString()
        })
      });

      // Add to current user's sent requests
      await updateDoc(currentUserRef, {
        sentFriendRequests: arrayUnion(targetUserId)
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === targetUserId
            ? { ...user, isRequestSent: true }
            : user
        )
      );

      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    }
  };

  const handleCancelRequest = async (targetUserId) => {
    try {
      const targetUserRef = doc(db, 'users', targetUserId);
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);

      // Remove friend request from target user's friendRequests
      await updateDoc(targetUserRef, {
        friendRequests: arrayRemove({
          uid: auth.currentUser.uid,
          status: 'pending'
        })
      });

      // Remove from current user's sent requests
      await updateDoc(currentUserRef, {
        sentFriendRequests: arrayRemove(targetUserId)
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === targetUserId
            ? { ...user, isRequestSent: false }
            : user
        )
      );

      alert('Friend request cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    }
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!newTeamName) {
      alert('Please enter a team name');
      return;
    }
    if (selectedConnections.length === 0) {
      alert('Please select at least one connection for your team');
      return;
    }

    try {
      setIsCreatingTeam(true);
      await teamService.createTeam({
        name: newTeamName,
        description: '',
        members: selectedConnections
      });
      
      // Reset form
      setNewTeamName('');
      setSelectedConnections([]);
      
      // Refresh teammates list
      const updatedTeammates = await teammateService.getTeammates();
      setTeammates(updatedTeammates);
      
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleConnectionSelect = (connectionId) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'connections':
        return (
          <>
            {/* Existing Connections Section */}
            <Typography variant="h5" gutterBottom>
              Your Connections ({connections.length})
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : connections.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ my: 4 }}>
                You don't have any connections yet.
              </Typography>
            ) : (
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {connections.map((connection) => (
                  <Grid item xs={12} sm={6} md={4} key={connection}>
                    <UserCard 
                      user={users.find(u => u.id === connection) || {
                        id: connection,
                        name: "Loading...",
                        headline: "",
                        profile: { profile_image: defaultProfileImage }
                      }}
                      isConnection={true}
                      onRemoveConnection={() => handleRemoveConnection(connection)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            {/* People You May Know Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              People You May Know
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ my: 4 }}>
                No suggestions available at the moment.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {users.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <UserCard 
                      user={user}
                      onSendRequest={() => handleSendFriendRequest(user.id)}
                      onCancelRequest={() => handleCancelRequest(user.id)}
                      isRequestSent={user.isRequestSent}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        );

      case 'invitations':
        return (
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Friend Requests ({friendRequests.length})
            </Typography>
            <FriendRequests requests={friendRequests} />
          </Box>
        );

      case 'teammates':
        return (
          <Box>
            {/* Team Creation Form */}
            <Card sx={{ mb: 4, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Create New Team
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Team Name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="subtitle1" gutterBottom>
                  Select Team Members:
                </Typography>
                <Grid container spacing={2}>
                  {connections.map((connectionId) => {
                    const connection = users.find(u => u.id === connectionId);
                    if (!connection) return null;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={connectionId}>
                        <Card 
                          sx={{ 
                            border: selectedConnections.includes(connectionId) ? 2 : 0,
                            borderColor: 'primary.main',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleConnectionSelect(connectionId)}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Avatar 
                                src={connection.profile?.profile_image || defaultProfileImage} 
                                sx={{ mr: 2 }}
                              />
                              <Box>
                                <Typography variant="subtitle1">
                                  {connection.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {connection.headline}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateTeam}
                disabled={isCreatingTeam || !newTeamName || selectedConnections.length === 0}
                sx={{ mt: 2 }}
              >
                {isCreatingTeam ? <CircularProgress size={24} /> : 'Create Team'}
              </Button>
            </Card>

            {/* Existing Teammates Section */}
            <Typography variant="h5" gutterBottom>
              Your Teammates
            </Typography>
            {teammates.length > 0 ? (
              <Grid container spacing={3}>
                {teammates.map((teammate) => (
                  <Grid item xs={12} sm={6} md={4} key={teammate.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar src={teammate.profile_image || defaultProfileImage} />
                          <Box ml={2}>
                            <Typography variant="h6">{teammate.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {teammate.role}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => handleRemoveTeammate(teammate.id)}
                        >
                          Remove Teammate
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="textSecondary">No teammates yet</Typography>
            )}

            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Teammate Invites
              </Typography>
              {teammateInvites.map((invite) => (
                <Card key={invite.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{invite.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {invite.role}
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAcceptTeammateInvite(invite.id)}
                          sx={{ mr: 1 }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectTeammateInvite(invite.id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 'pages':
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Your Pages
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Grid container spacing={3}>
                {pages.map((page) => (
                  <Grid item xs={12} sm={6} md={4} key={page.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{page.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {page.followerCount} followers
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleUnfollowPage(page.id)}
                        >
                          Unfollow
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Suggested Pages
              </Typography>
              <Grid container spacing={3}>
                {pages.map((page) => (
                  <Grid item xs={12} sm={6} md={4} key={page.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{page.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {page.followerCount} followers
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleFollowPage(page.id)}
                        >
                          Follow
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        );

      case 'hashtags':
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Your Hashtags
            </Typography>
            {followedHashtags.length > 0 ? (
              <Grid container spacing={3}>
                {followedHashtags.map((hashtag) => (
                  <Grid item xs={12} sm={6} md={4} key={hashtag.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">#{hashtag.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {hashtag.posts} posts
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleUnfollowHashtag(hashtag.id)}
                        >
                          Unfollow
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="textSecondary">You don't follow any hashtags yet</Typography>
            )}

            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Trending Hashtags
              </Typography>
              <Grid container spacing={3}>
                {hashtags.map((hashtag) => (
                  <Grid item xs={12} sm={6} md={4} key={hashtag.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">#{hashtag.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {hashtag.posts} posts
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleFollowHashtag(hashtag.id)}
                        >
                          Follow
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <div className="network-modern-layout">
      <aside className="network-modern-sidebar">
        <ul className="network-modern-links">
          <li 
            className={selectedTab === 'connections' ? 'active' : ''} 
            onClick={() => setSelectedTab('connections')}
          >
            <FaLink /> Connections <span>{connections.length}</span>
          </li>
          <li 
            className={selectedTab === 'invitations' ? 'active' : ''} 
            onClick={() => setSelectedTab('invitations')}
          >
            <FaBell /> Invitations <span>{friendRequests.length}</span>
          </li>
          <li 
            className={selectedTab === 'teammates' ? 'active' : ''} 
            onClick={() => setSelectedTab('teammates')}
          >
            <FaUsers /> Teammates
          </li>
          <li 
            className={selectedTab === 'pages' ? 'active' : ''} 
            onClick={() => setSelectedTab('pages')}
          >
            <FaLayerGroup /> Pages <span>28</span>
          </li>
          <li 
            className={selectedTab === 'hashtags' ? 'active' : ''} 
            onClick={() => setSelectedTab('hashtags')}
          >
            <FaHashtag /> Hashtags <span>8</span>
          </li>
        </ul>
      </aside>
      
      <section className="network-modern-content">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {renderContent()}
        </Container>
      </section>
    </div>
  );
};

export default Network;