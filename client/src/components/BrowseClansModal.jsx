import { useState, useEffect } from 'react';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function BrowseClansModal({ user, onClose, onJoined }) {
  const [clans, setClans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => { fetchClans(); }, [search]);

  const fetchClans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: 'score' });
      if (search) params.append('search', search);
      const res = await fetch(`${SERVER_URL}/api/clans?${params}`);
      const data = await res.json();
      setClans(data.clans || []);
    } catch(e) {}
    setLoading(false);
  };

  const handleJoin = async (clan) => {
    setJoining(prev => ({...prev, [clan.id]: true}));
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      setMessages(prev => ({...prev, [clan.id]: data.message || (data.success ? 'Done!' : data.error)}));
      if (data.joined) onJoined(clan);
    } catch(e) {
      setMessages(prev => ({...prev, [clan.id]: 'Error joining clan'}));
    }
    setJoining(prev => ({...prev, [clan.id]: false}));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="browse-clans-modal">
        <div className="browse-clans-header">
          <h2>🛡 Browse Clans</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="browse-clans-search">
          <input
            className="browse-clans-input"
            placeholder="🔍 Search clans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="browse-clans-list">
          {loading && <p className="browse-clans-loading">Loading clans...</p>}
          {!loading && clans.length === 0 && <p className="browse-clans-empty">No clans found</p>}
          {clans.map(clan => (
            <div className="browse-clan-row" key={clan.id}>
              <div className="browse-clan-banner">
                {clan.banner_url ? <img src={clan.banner_url} alt={clan.name} /> : <span>🛡</span>}
              </div>
              <div className="browse-clan-info">
                <p className="browse-clan-name">{clan.name} <span className="browse-clan-tag">[{clan.tag}]</span></p>
                <p className="browse-clan-desc">{clan.description || 'No description'}</p>
                <div className="browse-clan-meta">
                  <span>👥 {clan.member_count?.[0]?.count || 0}/50</span>
                  <span>⭐ {clan.level || 1}</span>
                  <span>🏆 {(clan.required_trophies || 0).toLocaleString()} req.</span>
                  <span className={`browse-clan-type browse-clan-type--${clan.type?.toLowerCase().replace(' ','-')}`}>{clan.type || 'Open'}</span>
                </div>
                {messages[clan.id] && <p className="browse-clan-msg">{messages[clan.id]}</p>}
              </div>
              <button
                className="browse-clan-join-btn"
                onClick={() => handleJoin(clan)}
                disabled={joining[clan.id] || !!messages[clan.id]}
              >
                {joining[clan.id] ? '...' : messages[clan.id] ? '✓' : clan.type === 'Open' ? 'JOIN' : 'REQUEST'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
