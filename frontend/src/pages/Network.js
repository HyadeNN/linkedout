import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService } from '../services';
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

  return (
    <div className="page-container">
      <div className="network-page">
        <div className="network-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Manage my network</h2>
            </div>
            <ul className="sidebar-links">
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'connections' ? 'active' : ''}`}
                  onClick={() => handleTabChange('connections')}
                >
                  <FaLink className="link-icon" />
                  <span className="link-text">Connections</span>
                  <span className="link-count">{connectionsCount}</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'requests' ? 'active' : ''}`}
                  onClick={() => handleTabChange('requests')}
                >
                  <FaBell className="link-icon" />
                  <span className="link-text">Invitations</span>
                  <span className="link-count highlight">{requestsCount}</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'teammates' ? 'active' : ''}`}
                  onClick={() => handleTabChange('teammates')}
                >
                  <FaUsers className="link-icon" />
                  <span className="link-text">Teammates</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'groups' ? 'active' : ''}`}
                  onClick={() => handleTabChange('groups')}
                >
                  <FaUsers className="link-icon" />
                  <span className="link-text">Groups</span>
                  <span className="link-count">6</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'pages' ? 'active' : ''}`}
                  onClick={() => handleTabChange('pages')}
                >
                  <FaLayerGroup className="link-icon" />
                  <span className="link-text">Pages</span>
                  <span className="link-count">28</span>
                </button>
              </li>
              <li>
                <button
                  className={`sidebar-link ${selectedTab === 'hashtags' ? 'active' : ''}`}
                  onClick={() => handleTabChange('hashtags')}
                >
                  <FaHashtag className="link-icon" />
                  <span className="link-text">Hashtags</span>
                  <span className="link-count">8</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="network-content">
          {selectedTab === 'requests' && (
            <>
              <div className="tabs-section">
                <button
                  className={`tab-button ${selectedTab === 'received' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('received')}
                >
                  Received
                </button>
                <button
                  className={`tab-button ${selectedTab === 'sent' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('sent')}
                >
                  Sent
                </button>
              </div>

              <div className="divider">
                <span className="divider-text">You have {requestsCount} new connections</span>
              </div>

              {requestsLoading ? (
                <div className="loading-indicator">Loading invitations...</div>
              ) : requests.length === 0 ? (
                <div className="empty-state">
                  <h3>No pending invitations</h3>
                  <p>When someone invites you to connect, you'll see it here.</p>
                </div>
              ) : (
                <div className="requests-list">
                  {requests.map(request => (
                    <div key={request.id} className="connection-request-card">
                      <div className="request-avatar">
                        <Link to={`/users/${request.sender.id}`}>
                          <img
                            src={request.sender.profile?.profile_image || '/default-avatar.jpg'}
                            alt={`${request.sender.first_name} ${request.sender.last_name}`}
                          />
                        </Link>
                      </div>

                      <div className="request-info">
                        <h3 className="request-name">
                          <Link to={`/users/${request.sender.id}`}>
                            {request.sender.first_name} {request.sender.last_name}
                          </Link>
                        </h3>
                        <p className="request-headline">
                          {request.sender.profile?.headline || 'No headline'}
                        </p>
                        <p className="request-connections">
                          {request.sender.profile?.connections_count || 0} connections
                        </p>
                      </div>

                      {request.message && (
                        <div className="request-message">
                          {request.message}
                        </div>
                      )}

                      <div className="request-actions">
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={actionLoading}
                        >
                          Accept
                        </button>
                        <button
                          className="decline-btn"
                          onClick={() => handleIgnoreRequest(request.id)}
                          disabled={actionLoading}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="recent-connections">
                <div className="section-header">
                  <h2 className="section-title">Recent connections</h2>
                </div>

                <div className="recent-grid">
                  {connections.slice(0, 4).map(connection => (
                    <div key={connection.id} className="recent-card">
                      <div className="recent-avatar">
                        <Link to={`/users/${connection.user.id}`}>
                          <img
                            src={connection.user.profile?.profile_image || '/default-avatar.jpg'}
                            alt={`${connection.user.first_name} ${connection.user.last_name}`}
                          />
                        </Link>
                      </div>

                      <div className="recent-info">
                        <h3 className="recent-name">
                          <Link to={`/users/${connection.user.id}`}>
                            {connection.user.first_name} {connection.user.last_name}
                          </Link>
                        </h3>
                        <p className="recent-headline">
                          {connection.user.profile?.headline || 'No headline'}
                        </p>
                      </div>

                      <p className="recent-date">
                        {new Date(connection.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
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
            <div className="teammates-tab">
              <h1 className="page-title">Teammates</h1>
              <div className="empty-state">
                <h3>No teammates yet</h3>
                <p>Invite your teammates to join your network.</p>
                <button className="invite-teammates-btn">Invite Teammates</button>
              </div>
            </div>
          )}

          {selectedTab === 'groups' && (
            <div className="groups-tab">
              <h1 className="page-title">Groups</h1>
              <div className="empty-state">
                <h3>No groups yet</h3>
                <p>Create a group to collaborate with others.</p>
                <button className="create-group-btn">Create Group</button>
              </div>
            </div>
          )}

          {selectedTab === 'pages' && (
            <div className="pages-tab">
              <h1 className="page-title">Pages</h1>
              <div className="empty-state">
                <h3>No pages yet</h3>
                <p>Follow pages to get updates on their posts and activities.</p>
                <button className="follow-pages-btn">Follow Pages</button>
              </div>
            </div>
          )}

          {selectedTab === 'hashtags' && (
            <div className="hashtags-tab">
              <h1 className="page-title">Hashtags</h1>
              <div className="empty-state">
                <h3>No hashtags yet</h3>
                <p>Explore trending topics and join conversations.</p>
                <button className="explore-hashtags-btn">Explore Hashtags</button>
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
        </div>
      </div>
    </div>
  );
};

export default Network;