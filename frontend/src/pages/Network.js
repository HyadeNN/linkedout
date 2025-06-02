import React, { useState } from 'react';
import ConnectionList from '../components/network/ConnectionList';
import ConnectionRequests from '../components/network/ConnectionRequests';
import ConnectionSuggestions from '../components/network/ConnectionSuggestions';

const Network = () => {
  const [selectedTab, setSelectedTab] = useState('connections');

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
              </button>
            </li>
            <li>
              <button
                className={`sidebar-link ${selectedTab === 'requests' ? 'active' : ''}`}
                onClick={() => handleTabChange('requests')}
              >
                <span className="link-icon">📩</span>
                <span className="link-text">Invitations</span>
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
            <ConnectionList showViewAll={false} limit={20} />
          </div>
        )}

        {selectedTab === 'requests' && (
          <div className="requests-tab">
            <h1 className="page-title">Invitations</h1>
            <ConnectionRequests showViewAll={false} limit={20} />
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
          <ConnectionSuggestions />
        </div>
      </div>
    </div>
  );
};

export default Network;