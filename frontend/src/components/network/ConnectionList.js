import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService } from '../../services';

const ConnectionList = ({ limit = 5, showViewAll = true, userId = null }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalConnections, setTotalConnections] = useState(0);

  useEffect(() => {
    fetchConnections();
  }, [limit, userId]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (userId) {
        // Fetch mutual connections if userId is provided
        response = await connectionService.getMutualConnections(userId, 1, limit);
      } else {
        // Fetch user's connections
        response = await connectionService.getConnections(1, limit);
      }

      setConnections(response.items);
      setTotalConnections(response.total);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setError('Failed to load connections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    try {
      await connectionService.deleteConnection(connectionId);
      setConnections(connections.filter(conn => conn.id !== connectionId));
      setTotalConnections(prev => prev - 1);
    } catch (err) {
      console.error('Failed to remove connection:', err);
      alert('Failed to remove connection. Please try again.');
    }
  };

  // Helper function to get the connected user from a connection object
  const getConnectionUser = (connection) => {
    if (!connection.sender || !connection.receiver) return null;

    // For mutual connections, the user might be in user property instead
    if (connection.user) return connection.user;

    // Otherwise determine from sender/receiver
    return connection.sender_id === userId
      ? connection.receiver
      : connection.sender;
  };

  if (loading) {
    return <div className="loading-spinner">Loading connections...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (connections.length === 0) {
    return (
      <div className="connections-empty">
        <h3>{userId ? 'No mutual connections' : 'No connections yet'}</h3>
        <p>{userId ? 'You don\'t have any mutual connections with this user.' : 'Connect with professionals to grow your network.'}</p>
        {!userId && (
          <Link to="/network" className="find-connections-link">Find Connections</Link>
        )}
      </div>
    );
  }

  return (
    <div className="connections-component">
      <div className="connections-header">
        <h2>{userId ? 'Mutual Connections' : 'Connections'} {totalConnections > 0 && `(${totalConnections})`}</h2>
        {showViewAll && totalConnections > limit && (
          <Link to={userId ? `/network/mutual/${userId}` : "/network"} className="view-all-link">
            View All
          </Link>
        )}
      </div>

      <div className="connections-list">
        {connections.map(connection => {
          const connectionUser = getConnectionUser(connection);
          if (!connectionUser) return null;

          return (
            <div key={connection.id} className="connection-item">
              <Link to={`/users/${connectionUser.id}`} className="connection-info">
                <img
                  src={connectionUser.profile?.profile_image || '/default-avatar.jpg'}
                  alt={`${connectionUser.first_name} ${connectionUser.last_name}`}
                  className="connection-avatar"
                />
                <div className="connection-details">
                  <h3 className="connection-name">
                    {connectionUser.first_name} {connectionUser.last_name}
                  </h3>
                  <p className="connection-headline">
                    {connectionUser.profile?.headline || 'No headline'}
                  </p>
                </div>
              </Link>

              {!userId && (
                <div className="connection-actions">
                  <button
                    className="message-btn"
                    onClick={() => alert('Messaging feature not implemented yet')}
                  >
                    Message
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveConnection(connection.id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionList;