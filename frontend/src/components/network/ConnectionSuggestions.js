import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService } from '../../services';

const ConnectionSuggestions = ({ limit = 5, showViewAll = true }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [connectingIds, setConnectingIds] = useState(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await connectionService.getConnectionSuggestions(1, limit);
      setSuggestions(response.items);
      setTotalSuggestions(response.total);
    } catch (err) {
      console.error('Failed to fetch connection suggestions:', err);
      setError('Failed to load connection suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      setConnectingIds(prev => new Set(prev).add(userId));
      await connectionService.createConnectionRequest(userId);

      // Remove the user from suggestions
      setSuggestions(prev => prev.filter(suggestion => suggestion.id !== userId));
      setTotalSuggestions(prev => prev - 1);
    } catch (err) {
      console.error('Failed to send connection request:', err);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setConnectingIds(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading suggestions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-empty">
        <h3>No suggestions available</h3>
        <p>We'll suggest new people for you to connect with soon.</p>
      </div>
    );
  }

  return (
    <div className="connection-suggestions-component">
      <div className="suggestions-header">
        <h2>People you may know</h2>
        {showViewAll && totalSuggestions > limit && (
          <Link to="/network" className="view-all-link">
            View All
          </Link>
        )}
      </div>

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

              {suggestion.mutualConnections > 0 && (
                <p className="mutual-connections">
                  {suggestion.mutualConnections} mutual connection
                  {suggestion.mutualConnections !== 1 ? 's' : ''}
                </p>
              )}

              <button
                className="connect-btn"
                onClick={() => handleConnect(suggestion.id)}
                disabled={connectingIds.has(suggestion.id)}
              >
                {connectingIds.has(suggestion.id) ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionSuggestions;