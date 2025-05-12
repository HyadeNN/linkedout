import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService, pageService, hashtagService, groupService, teammateService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { FaLink, FaBell, FaUsers, FaLayerGroup, FaHashtag } from 'react-icons/fa';
import './Network.css';

const Network = () => {
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('received');
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [followedPages, setFollowedPages] = useState([]);
  const [newPageName, setNewPageName] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [followedHashtags, setFollowedHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [teammates, setTeammates] = useState([]);
  const [teammateInvites, setTeammateInvites] = useState([]);
  const [inviteUserId, setInviteUserId] = useState('');

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const response = await connectionService.getConnections();
        setConnections(response.items);
        setConnectionsCount(response.total);
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
      pageService.getPages().then(setPages);
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

  // Groups
  useEffect(() => {
    if (selectedTab === 'groups') {
      groupService.getGroups().then(setGroups);
      groupService.getUserGroups().then(setUserGroups);
    }
  }, [selectedTab]);

  // Teammates
  useEffect(() => {
    if (selectedTab === 'teammates') {
      teammateService.getTeammates().then(setTeammates);
      teammateService.getTeammateInvites().then(setTeammateInvites);
    }
  }, [selectedTab]);

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
  const handleAcceptRequest = async (connectionId) => {
    try {
      setActionLoading(true);
      await connectionService.updateConnectionStatus(connectionId, 'accepted');

      // Move from requests to connections
      const acceptedRequest = requests.find(request => request.id === connectionId);
      if (acceptedRequest) {
        const updatedRequest = { ...acceptedRequest, status: 'accepted' };
        setConnections(prevConnections => [...prevConnections, updatedRequest]);
        setConnectionsCount(prevCount => prevCount + 1);
        setRequests(prevRequests => prevRequests.filter(request => request.id !== connectionId));
        setRequestsCount(prevCount => prevCount - 1);
      }
    } catch (error) {
      console.error('Failed to accept connection request:', error);
      alert('Failed to accept connection request. Please try again.');
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
      await connectionService.deleteConnection(connectionId);

      // Remove from connections
      setConnections(prevConnections => prevConnections.filter(connection => connection.id !== connectionId));
      setConnectionsCount(prevCount => prevCount - 1);
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
    await pageService.createPage({ name: newPageName });
    setNewPageName('');
    const all = await pageService.getPages();
    setPages(all);
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

  // Groups
  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    await groupService.createGroup({ name: newGroupName });
    setNewGroupName('');
    setGroups(await groupService.getGroups());
  };

  const handleJoinGroup = async (groupId) => {
    await groupService.joinGroup(groupId);
    setUserGroups(await groupService.getUserGroups());
  };

  const handleLeaveGroup = async (userGroupId) => {
    await groupService.leaveGroup(userGroupId);
    setUserGroups(await groupService.getUserGroups());
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

  return (
    <div className="network-modern-layout">
      <aside className="network-modern-sidebar">
        <ul className="network-modern-links">
          <li className={selectedTab === 'connections' ? 'active' : ''} onClick={() => handleTabChange('connections')}>
            <FaLink /> Connections <span>{connectionsCount}</span>
          </li>
          <li className={selectedTab === 'requests' ? 'active' : ''} onClick={() => handleTabChange('requests')}>
            <FaBell /> Invitations <span className={requestsCount > 0 ? 'highlight' : ''}>{requestsCount}</span>
          </li>
          <li className={selectedTab === 'teammates' ? 'active' : ''} onClick={() => handleTabChange('teammates')}>
            <FaUsers /> Teammates
          </li>
          <li className={selectedTab === 'groups' ? 'active' : ''} onClick={() => handleTabChange('groups')}>
            <FaUsers /> Groups <span>6</span>
          </li>
          <li className={selectedTab === 'pages' ? 'active' : ''} onClick={() => handleTabChange('pages')}>
            <FaLayerGroup /> Pages <span>28</span>
          </li>
          <li className={selectedTab === 'hashtags' ? 'active' : ''} onClick={() => handleTabChange('hashtags')}>
            <FaHashtag /> Hashtags <span>8</span>
          </li>
        </ul>
      </aside>
      <section className="network-modern-content">
        {selectedTab === 'requests' && (
          <>
            <div className="network-modern-tabs">
              <button className={selectedTab === 'received' ? 'active' : ''} onClick={() => setSelectedTab('received')}>RECEIVED</button>
              <button className={selectedTab === 'sent' ? 'active' : ''} onClick={() => setSelectedTab('sent')}>SENT</button>
            </div>
            <div className="network-modern-divider" />
            <div className="network-modern-new-connections">
              YOU HAVE <span>{requestsCount} NEW CONNECTION{requestsCount !== 1 ? 'S' : ''}</span>
            </div>
            {requestsLoading ? (
              <div className="loading-indicator">Loading invitations...</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <h3>No pending invitations</h3>
                <p>When someone invites you to connect, you'll see it here.</p>
              </div>
            ) : (
              requests.map(request => (
                <div key={request.id} className="network-modern-request-card">
                  <img src={request.sender.profile?.profile_image || '/default-avatar.jpg'} alt="avatar" className="network-modern-avatar" />
                  <div className="network-modern-request-info">
                    <div className="network-modern-request-name">{request.sender.first_name} {request.sender.last_name}</div>
                    <div className="network-modern-request-headline">{request.sender.profile?.headline || 'No headline'}</div>
                    <div className="network-modern-request-connections">{request.sender.profile?.connections_count || 0} connections</div>
                    {request.message && <div className="network-modern-request-message">{request.message}</div>}
                  </div>
                  <div className="network-modern-request-actions">
                    <button className="accept-btn" onClick={() => handleAcceptRequest(request.id)} disabled={actionLoading}>ACCEPT</button>
                    <button className="decline-btn" onClick={() => handleIgnoreRequest(request.id)} disabled={actionLoading}>DECLINE</button>
                  </div>
                </div>
              ))
            )}
            <div className="network-modern-divider" />
            <div className="network-modern-recent-header">RECENT CONNECTIONS</div>
            <div className="network-modern-recent-grid">
              {connections.slice(0, 4).map(connection => (
                <div key={connection.id} className="network-modern-recent-card">
                  <img src={connection.user.profile?.profile_image || '/default-avatar.jpg'} alt="avatar" className="network-modern-avatar" />
                  <div className="network-modern-recent-info">
                    <div className="network-modern-recent-name">{connection.user.first_name} {connection.user.last_name}</div>
                    <div className="network-modern-recent-headline">{connection.user.profile?.headline || 'No headline'}</div>
                    <div className="network-modern-recent-date">{new Date(connection.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {selectedTab === 'connections' && (
          <div className="connections-tab">
            <h1 className="page-title">Connections</h1>

            {loading ? (
              <div className="loading-indicator">Loading connections...</div>
            ) : connections.length === 0 ? (
              <div className="empty-state">
                <h3>No connections yet</h3>
                <p>Connect with professionals to grow your network.</p>
              </div>
            ) : (
              <div className="connections-list">
                {connections.map(connection => {
                  const connectionUser = connection.user;

                  return (
                    <div key={connection.id} className="connection-card">
                      <div className="connection-avatar">
                        <Link to={`/users/${connectionUser.id}`}>
                          <img
                            src={connectionUser.profile?.profile_image || '/default-avatar.jpg'}
                            alt={`${connectionUser.first_name} ${connectionUser.last_name}`}
                          />
                        </Link>
                      </div>

                      <div className="connection-info">
                        <h3 className="connection-name">
                          <Link to={`/users/${connectionUser.id}`}>
                            {connectionUser.first_name} {connectionUser.last_name}
                          </Link>
                        </h3>
                        <p className="connection-headline">
                          {connectionUser.profile?.headline || 'No headline'}
                        </p>
                        <p className="connection-date">
                          Connected since {new Date(connection.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="connection-actions">
                        <button className="message-btn">Message</button>
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveConnection(connection.id)}
                          disabled={actionLoading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'teammates' && (
          <div className="network-section">
            <h1 className="section-title">Teammates</h1>
            <div className="network-form-row">
              <input className="network-input" value={inviteUserId} onChange={e => setInviteUserId(e.target.value)} placeholder="User ID to invite" />
              <button className="network-btn primary" onClick={handleSendTeammateInvite}>Send Invite</button>
            </div>
            <h2 className="section-subtitle">Teammate Invites</h2>
            <div className="network-card-list">
              {teammateInvites.length === 0 ? <div className="network-empty">No invites.</div> : teammateInvites.map(invite => (
                <div className="network-card" key={invite.id}>
                  <div className="network-card-title">{invite.userIds.join(', ')} - {invite.status}</div>
                  <button className="network-btn primary" onClick={() => handleAcceptTeammateInvite(invite.id)}>Accept</button>
                  <button className="network-btn danger" onClick={() => handleRejectTeammateInvite(invite.id)}>Reject</button>
                </div>
              ))}
            </div>
            <h2 className="section-subtitle">Teammates</h2>
            <div className="network-card-list">
              {teammates.length === 0 ? <div className="network-empty">No teammates yet.</div> : teammates.map(tm => (
                <div className="network-card" key={tm.id}>
                  <div className="network-card-title">{tm.userIds.join(', ')}</div>
                  <button className="network-btn danger" onClick={() => handleRemoveTeammate(tm.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'groups' && (
          <div className="network-section">
            <h1 className="section-title">Groups</h1>
            <div className="network-form-row">
              <input className="network-input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New group name" />
              <button className="network-btn primary" onClick={handleCreateGroup}>Create Group</button>
            </div>
            <h2 className="section-subtitle">All Groups</h2>
            <div className="network-card-list">
              {groups.length === 0 ? <div className="network-empty">No groups found.</div> : groups.map(group => (
                <div className="network-card" key={group.id}>
                  <div className="network-card-title">{group.name}</div>
                  <button className="network-btn" onClick={() => handleJoinGroup(group.id)}>Join</button>
                </div>
              ))}
            </div>
            <h2 className="section-subtitle">Joined Groups</h2>
            <div className="network-card-list">
              {userGroups.length === 0 ? <div className="network-empty">You have not joined any groups.</div> : userGroups.map(ug => (
                <div className="network-card" key={ug.id}>
                  <div className="network-card-title">{ug.groupId}</div>
                  <button className="network-btn danger" onClick={() => handleLeaveGroup(ug.id)}>Leave</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'pages' && (
          <div className="network-section">
            <h1 className="section-title">Pages</h1>
            <div className="network-form-row">
              <input className="network-input" value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="New page name" />
              <button className="network-btn primary" onClick={handleCreatePage}>Create Page</button>
            </div>
            <h2 className="section-subtitle">All Pages</h2>
            <div className="network-card-list">
              {pages.length === 0 ? <div className="network-empty">No pages found.</div> : pages.map(page => (
                <div className="network-card" key={page.id}>
                  <div className="network-card-title">{page.name}</div>
                  <button className="network-btn" onClick={() => handleFollowPage(page.id)}>Follow</button>
                </div>
              ))}
            </div>
            <h2 className="section-subtitle">Followed Pages</h2>
            <div className="network-card-list">
              {followedPages.length === 0 ? <div className="network-empty">You are not following any pages.</div> : followedPages.map(up => (
                <div className="network-card" key={up.id}>
                  <div className="network-card-title">{up.pageId}</div>
                  <button className="network-btn danger" onClick={() => handleUnfollowPage(up.id)}>Unfollow</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'hashtags' && (
          <div className="network-section">
            <h1 className="section-title">Hashtags</h1>
            <div className="network-form-row">
              <input className="network-input" value={newHashtag} onChange={e => setNewHashtag(e.target.value)} placeholder="New hashtag name" />
              <button className="network-btn primary" onClick={handleCreateHashtag}>Create Hashtag</button>
            </div>
            <h2 className="section-subtitle">All Hashtags</h2>
            <div className="network-card-list">
              {hashtags.length === 0 ? <div className="network-empty">No hashtags found.</div> : hashtags.map(hashtag => (
                <div className="network-card" key={hashtag.id}>
                  <div className="network-card-title">#{hashtag.name}</div>
                  <button className="network-btn" onClick={() => handleFollowHashtag(hashtag.id)}>Follow</button>
                </div>
              ))}
            </div>
            <h2 className="section-subtitle">Followed Hashtags</h2>
            <div className="network-card-list">
              {followedHashtags.length === 0 ? <div className="network-empty">You are not following any hashtags.</div> : followedHashtags.map(uh => {
                const hashtag = hashtags.find(h => h.id === uh.hashtagId);
                return (
                  <div className="network-card" key={uh.id}>
                    <div className="network-card-title">{hashtag ? `#${hashtag.name}` : uh.hashtagId}</div>
                    <button className="network-btn danger" onClick={() => handleUnfollowHashtag(uh.id)}>Unfollow</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connection Suggestions Section (always visible) */}
        <div className="suggestions-section">
          <h2 className="section-title">People you may know</h2>

          {suggestionsLoading ? (
            <div className="loading-indicator">Loading suggestions...</div>
          ) : suggestions.length === 0 ? (
            <div className="empty-suggestions">
              <p>No suggestions available at the moment.</p>
            </div>
          ) : (
            <div className="suggestions-grid">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-header">
                    <Link to={`/users/${suggestion.id}`}>
                      <img
                        src={suggestion.profile?.profile_image || '/default-avatar.jpg'}
                        alt={`${suggestion.first_name} ${suggestion.last_name}`}
                        className="suggestion-avatar"
                      />
                    </Link>
                  </div>

                  <div className="suggestion-body">
                    <h3 className="suggestion-name">
                      <Link to={`/users/${suggestion.id}`}>
                        {suggestion.first_name} {suggestion.last_name}
                      </Link>
                    </h3>
                    <p className="suggestion-headline">
                      {suggestion.profile?.headline || 'No headline'}
                    </p>
                    <button
                      className="connect-btn"
                      onClick={() => handleConnect(suggestion.id)}
                      disabled={actionLoading}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Network;