import { useState, useEffect } from 'react';
import './FriendsPanel.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function FriendsPanel({ user, onClose, onInviteToGame, isDropdown }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  useEffect(() => {
    if (actionMsg) setTimeout(() => setActionMsg(''), 3000);
  }, [actionMsg]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/${user.id}`);
      const data = await res.json();
      // Normalize: get the OTHER person in each friendship
      const normalized = data.map(f => ({
        friendshipId: f.id,
        ...(f.user_id === user.id ? f.friend : f.requester)
      }));
      setFriends(normalized);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/requests/${user.id}`);
      const data = await res.json();
      setPendingRequests(data);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/users/search?q=${encodeURIComponent(q)}&currentUserId=${user.id}`);
      const data = await res.json();
      setSearchResults(data);
    } catch(e) {
      console.error(e);
    }
    setSearching(false);
  };

  const sendFriendRequest = async (friendId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId })
      });
      const data = await res.json();
      setActionMsg(data.message || 'Request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch(e) {
      setActionMsg('Error sending request');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await fetch(`${SERVER_URL}/api/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      setActionMsg('Friend added!');
      fetchFriends();
      fetchPendingRequests();
    } catch(e) {
      setActionMsg('Error accepting request');
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await fetch(`${SERVER_URL}/api/friends/${requestId}`, { method: 'DELETE' });
      fetchPendingRequests();
    } catch(e) {
      console.error(e);
    }
  };

  const removeFriend = async (friendshipId) => {
    try {
      await fetch(`${SERVER_URL}/api/friends/${friendshipId}`, { method: 'DELETE' });
      setActionMsg('Friend removed');
      fetchFriends();
    } catch(e) {
      console.error(e);
    }
  };

  const getXPProgress = (xp, level) => {
    const xpForLevel = level * 500;
    return Math.min((xp / xpForLevel) * 100, 100);
  };

  // Panel content
  const content = (
    <div className={`friends-panel ${isDropdown ? 'friends-panel--dropdown' : ''}`}>

        {/* Header */}
        <div className="friends-header">
          <h2 className="friends-title">👥 Friends</h2>
          <button className="friends-close" onClick={onClose}>✕</button>
        </div>

        {actionMsg && <div className="friends-action-msg">{actionMsg}</div>}

        {/* Tabs */}
        <div className="friends-tabs">
          <button
            className={`friends-tab ${activeTab === 'friends' ? 'friends-tab--active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends {friends.length > 0 && <span className="friends-count">{friends.length}</span>}
          </button>
          <button
            className={`friends-tab ${activeTab === 'requests' ? 'friends-tab--active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests {pendingRequests.length > 0 && <span className="friends-count friends-count--pending">{pendingRequests.length}</span>}
          </button>
          <button
            className={`friends-tab ${activeTab === 'add' ? 'friends-tab--active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Friends
          </button>
        </div>

        {/* FRIENDS LIST TAB */}
        {activeTab === 'friends' && (
          <div className="friends-content">
            {loading && <p className="friends-loading">Loading...</p>}
            {!loading && friends.length === 0 && (
              <div className="friends-empty">
                <span>👤</span>
                <p>No friends yet. Add some!</p>
                <button className="friends-add-btn" onClick={() => setActiveTab('add')}>Find Friends</button>
              </div>
            )}
            {friends.map(friend => (
              <div className="friend-card" key={friend.friendshipId}>
                <div className="friend-avatar">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt={friend.username} referrerPolicy="no-referrer" />
                  ) : (
                    <span>{friend.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.username}</span>
                  <span className="friend-level">Level {friend.level || 1}</span>
                  <div className="friend-xp-bar">
                    <div className="friend-xp-fill" style={{width: `${getXPProgress(friend.xp || 0, friend.level || 1)}%`}} />
                  </div>
                </div>
                <div className="friend-actions">
                  {onInviteToGame && (
                    <button
                      className="friend-action-btn friend-action-btn--invite"
                      onClick={() => onInviteToGame(friend)}
                      title="Invite to game"
                    >
                      ⚔️
                    </button>
                  )}
                  <button
                    className="friend-action-btn friend-action-btn--remove"
                    onClick={() => removeFriend(friend.friendshipId)}
                    title="Remove friend"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PENDING REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="friends-content">
            {pendingRequests.length === 0 && (
              <div className="friends-empty">
                <span>📭</span>
                <p>No pending requests</p>
              </div>
            )}
            {pendingRequests.map(req => (
              <div className="friend-card" key={req.id}>
                <div className="friend-avatar">
                  {req.requester?.avatar_url ? (
                    <img src={req.requester.avatar_url} alt={req.requester.username} referrerPolicy="no-referrer" />
                  ) : (
                    <span>{req.requester?.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{req.requester?.username}</span>
                  <span className="friend-level">Level {req.requester?.level || 1}</span>
                </div>
                <div className="friend-actions">
                  <button
                    className="friend-action-btn friend-action-btn--accept"
                    onClick={() => acceptRequest(req.id)}
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button
                    className="friend-action-btn friend-action-btn--remove"
                    onClick={() => declineRequest(req.id)}
                    title="Decline"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD FRIENDS TAB */}
        {activeTab === 'add' && (
          <div className="friends-content">
            <div className="friends-search-box">
              <input
                className="friends-search-input"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
              />
              {searching && <span className="friends-search-spinner">⏳</span>}
            </div>

            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="friends-search-hint">Type at least 2 characters to search</p>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="friends-empty">
                <span>🔍</span>
                <p>No users found for "{searchQuery}"</p>
              </div>
            )}

            {searchResults.map(result => (
              <div className="friend-card" key={result.id}>
                <div className="friend-avatar">
                  {result.avatar_url ? (
                    <img src={result.avatar_url} alt={result.username} referrerPolicy="no-referrer" />
                  ) : (
                    <span>{result.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{result.username}</span>
                  <span className="friend-level">Level {result.level || 1}</span>
                </div>
                <div className="friend-actions">
                  <button
                    className="friend-action-btn friend-action-btn--add"
                    onClick={() => sendFriendRequest(result.id)}
                    title="Send friend request"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

    </div>
  );

  // Render with or without overlay wrapper
  if (isDropdown) return content;

  return (
    <div className="friends-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {content}
    </div>
  );
}
