import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionService } from '../../services';

const ConnectionRequests = ({ limit = 5, showViewAll = true }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchRequests();
  }, [limit]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await connectionService.getConnectionRequests(1, limit);
      setRequests(response.items);
      setTotalRequests(response.total);
    } catch (err) {
      console.error('Failed to fetch connection requests:', err);
      setError('Failed to load connection requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      setProcessingIds(prev => new Set(prev).add(request.id));
      await connectionService.updateConnectionStatus(request.id, 'accepted');
      setRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
      setTotalRequests(prev => prev - 1);
    } catch (err) {
      console.error('Failed to accept connection request:', err);
      alert('Failed to accept connection request. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(request.id);
        return updated;
      });
    }
  };

  const handleIgnoreRequest = async (request) => {
    try {
      setProcessingIds(prev => new Set(prev).add(request.id));
      await connectionService.deleteConnection(request.id);
      setRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));
      setTotalRequests(prev => prev - 1);
    } catch (err) {
      console.error('Failed to ignore connection request:', err);
      alert('Failed to ignore connection request. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(request.id);
        return updated;
      });
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading connection requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="requests-empty">
        <h3>No pending invitations</h3>
        <p>When someone invites you to connect, you'll see it here.</p>
      </div>
    );
  }

  return (
    <div className="connection-requests-component">
      <div className="requests-header">
        <h2>Invitations {totalRequests > 0 && `(${totalRequests})`}</h2>
        {showViewAll && totalRequests > limit && (
          <Link to="/network" className="view-all-link">
            View All
          </Link>
        )}
      </div>

      <div className="requests-list">
        {requests.map(request => (
          <div key={request.id} className="request-item">
            <Link to={`/users/${request.sender.id}`} className="request-info">
              <img
                src={request.sender.profile?.profile_image || '/default-avatar.jpg'}
                alt={`${request.sender.first_name} ${request.sender.last_name}`}
                className="request-avatar"
              />
              <div className="request-details">
                <h3 className="request-name">
                  {request.sender.first_name} {request.sender.last_name}
                </h3>
                <p className="request-headline">
                  {request.sender.profile?.headline || 'No headline'}
                </p>
                <p className="request-date">Sent {new Date(request.created_at).toLocaleDateString()}</p>
              </div>
            </Link>

            <div className="request-actions">
              <button
                className="accept-btn"
                onClick={() => handleAcceptRequest(request)}
                disabled={processingIds.has(request.id)}
              >
                Accept
              </button>
              <button
                className="ignore-btn"
                onClick={() => handleIgnoreRequest(request)}
                disabled={processingIds.has(request.id)}
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionRequests;