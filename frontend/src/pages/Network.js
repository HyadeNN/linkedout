import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const Network = () => {
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('connections');
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
    <div className="network-page">
      <div className="network-sidebar">
        <div className="sidebar-section">
          <h2 className="sidebar-title">Manage my network</h2>
          <ul className="sidebar-links">
            <li>
              <button
                className={`sidebar-link ${selectedTab === 'connections' ? 'active' : ''}`}
                onClick={() => handleTabChange('connections')}
              >
                <span className="link-icon">👥</span>
                <span className="link-text">Connections</span>
                <span className="link-count">{connectionsCount}</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-link ${selectedTab === 'requests' ? 'active' : ''}`}
                onClick={() => handleTabChange('requests')}
              >
                <span className="link-icon">📩</span>
                <span className="link-text">Invitations</span>
                <span className="link-count">{requestsCount}</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-link ${selectedTab === 'contacts' ? 'active' : ''}`}
                onClick={() => handleTabChange('contacts')}
              >
                <span className="link-icon">📇</span>
                <span className="link-text">Contacts</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-link ${selectedTab === 'following' ? 'active' : ''}`}
                onClick={() => handleTabChange('following')}
              >
                <span className="link-icon">👁️</span>
                <span className="link-text">Following & Followers</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="network-content">
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

        {selectedTab === 'requests' && (
          <div className="requests-tab">
            <h1 className="page-title">Invitations</h1>

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
                  <div key={request.id} className="request-card">
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
                      <p className="request-date">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={actionLoading}
                      >
                        Accept
                      </button>
                      <button
                        className="ignore-btn"
                        onClick={() => handleIgnoreRequest(request.id)}
                        disabled={actionLoading}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'contacts' && (
          <div className="contacts-tab">
            <h1 className="page-title">Contacts</h1>
            <div className="empty-state">
              <h3>No contacts yet</h3>
              <p>Import your email contacts to find people you know on LinkedOut.</p>
              <button className="import-contacts-btn">Import Contacts</button>
            </div>
          </div>
        )}

        {selectedTab === 'following' && (
          <div className="following-tab">
            <h1 className="page-title">Following & Followers</h1>
            <div className="empty-state">
              <h3>No following or followers yet</h3>
              <p>Follow people to get updates on their posts and activities.</p>
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
  );
};

export default Network;