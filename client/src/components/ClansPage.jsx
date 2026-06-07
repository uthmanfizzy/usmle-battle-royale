import { useState, useEffect, useRef } from 'react';
import './ClansPage.css';
import CreateClanModal from './CreateClanModal';
import BrowseClansModal from './BrowseClansModal';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function ClansPage({ user }) {
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState('Member');
  const [showCreate, setShowCreate] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [leaving, setLeaving] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserClan();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchUserClan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/user/${user.id}`);
      const clanData = await res.json();

      if (clanData) {
        setClan(clanData);
        await fetchClanDetails(clanData.id);
        await fetchClanChat(clanData.id);
      }
    } catch (e) {
      console.error('Failed to fetch user clan:', e);
    }
    setLoading(false);
  };

  const fetchClanDetails = async (clanId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clanId}`);
      const data = await res.json();

      if (data?.members) {
        const sortedMembers = data.members
          .map(m => ({
            ...m.user,
            role: m.role || 'Member',
            clan_xp: m.user?.clan_xp || 0,
            trophies: m.user?.trophies || 0,
            status: m.user?.status || 'offline'
          }))
          .sort((a, b) => b.clan_xp - a.clan_xp);

        setMembers(sortedMembers);

        // Find current user's role
        const userMember = data.members.find(m => m.user_id === user.id);
        if (userMember) {
          setUserRole(userMember.role || 'Member');
        }
      }
    } catch (e) {
      console.error('Failed to fetch clan details:', e);
    }
  };

  const fetchClanChat = async (clanId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clanId}/chat`);
      const data = await res.json();
      setChatMessages(data || []);
    } catch (e) {
      console.error('Failed to fetch chat:', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !clan) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: newMessage.trim()
        })
      });

      const result = await res.json();

      if (result.success) {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          message: newMessage.trim(),
          user: {
            username: user.username,
            avatar_url: user.avatar_url
          },
          created_at: new Date().toISOString()
        }]);
        setNewMessage('');
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = (new Date() - new Date(dateStr)) / 60000;
    if (diff < 1) return 'just now';
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const fetchJoinRequests = async () => {
    if (!clan || !['Leader','Elder'].includes(userRole)) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/requests`);
      const data = await res.json();
      setJoinRequests(data || []);
    } catch(e) {
      console.error('Failed to fetch join requests:', e);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this clan?')) return;
    setLeaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/members/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setClan(null);
        setMembers([]);
      } else {
        alert(data.error || 'Failed to leave clan');
      }
    } catch(e) {
      alert('Error leaving clan');
    }
    setLeaving(false);
  };

  const handleKick = async (memberId) => {
    if (!window.confirm('Kick this member?')) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kickedBy: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        alert(data.error);
      }
    } catch(e) {
      alert('Error kicking member');
    }
  };

  const handlePromote = async (memberId, newRole) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole, leaderId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.map(m => m.id === memberId ? {...m, role: newRole} : m));
      } else {
        alert(data.error);
      }
    } catch(e) {
      alert('Error changing role');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
        fetchClanDetails(clan.id);
      }
    } catch(e) {
      console.error('Failed to approve request:', e);
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/requests/${requestId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch(e) {
      console.error('Failed to deny request:', e);
    }
  };

  if (loading) {
    return (
      <div className="clan-loading">
        <p>Loading clan data...</p>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="clan-no-clan">
        <h2>You are not in a clan</h2>
        <p>Join or create a clan to compete with others!</p>
        <button className="clan-action-btn" onClick={() => setShowBrowse(true)}>🔍 Browse Clans</button>
        <button className="clan-action-btn clan-action-btn--create" onClick={() => setShowCreate(true)}>⚔️ Create Clan</button>
        {showCreate && <CreateClanModal user={user} onClose={() => setShowCreate(false)} onCreated={(c) => { setClan(c); fetchClanDetails(c.id); }} />}
        {showBrowse && <BrowseClansModal user={user} onClose={() => setShowBrowse(false)} onJoined={(c) => { setClan(c); setShowBrowse(false); fetchClanDetails(c.id); }} />}
      </div>
    );
  }

  const xpForNextLevel = clan.level * 5000;
  const xpProgress = Math.min(100, (clan.xp / xpForNextLevel) * 100);
  const topContributors = [...members].sort((a, b) => b.clan_xp - a.clan_xp).slice(0, 3);
  const onlineCount = members.filter(m => m.status === 'online').length;

  return (
    <div className="clan-page">

      {/* LEFT COLUMN */}
      <div className="clan-left">

        {/* Clan Info Panel */}
        <p className="clan-section-label">CLAN INFO</p>
        <div className="clan-card">
          <div className="clan-info-header">
            <div className="clan-banner">
              {clan.banner_url ? (
                <img src={clan.banner_url} alt={clan.name} />
              ) : (
                <div className="clan-banner-placeholder">🛡</div>
              )}
            </div>
            <div className="clan-info-text">
              <h3 className="clan-name">{clan.name} 👑</h3>
              <p className="clan-motto">{clan.description}</p>
            </div>
          </div>

          <div className="clan-stats-grid">
            <div className="clan-stat-row">
              <span>🏷 CLAN TAG</span>
              <span>{clan.tag}</span>
            </div>
            <div className="clan-stat-row">
              <span>👥 MEMBERS</span>
              <span>{clan.members_count || members.length} / 50</span>
            </div>
            <div className="clan-stat-row">
              <span>⭐ CLAN LEVEL</span>
              <span>{clan.level}</span>
            </div>
            <div className="clan-stat-row">
              <span>🏅 CLAN XP</span>
              <span>{clan.xp.toLocaleString()} / {xpForNextLevel.toLocaleString()}</span>
            </div>
          </div>

          <div className="clan-xp-bar">
            <div className="clan-xp-fill" style={{ width: `${xpProgress}%` }} />
          </div>

          <div className="clan-stats-grid">
            <div className="clan-stat-row">
              <span>🏆 REQ. TROPHIES</span>
              <span>{clan.required_trophies?.toLocaleString()}</span>
            </div>
            <div className="clan-stat-row">
              <span>📍 LOCATION</span>
              <span>{clan.location}</span>
            </div>
            <div className="clan-stat-row">
              <span>🛡 CLAN TYPE</span>
              <span>{clan.type}</span>
            </div>
          </div>

          {userRole === 'Leader' && <button className="clan-settings-btn">SETTINGS</button>}
          {userRole !== 'Leader' && (
            <button className="clan-leave-btn" onClick={handleLeave} disabled={leaving}>
              {leaving ? 'Leaving...' : '🚪 Leave Clan'}
            </button>
          )}
        </div>

        {/* Top Contributors */}
        <p className="clan-section-label">TOP CONTRIBUTORS</p>
        <div className="clan-card">
          {topContributors.map((member, i) => (
            <div className="clan-contributor" key={member.id}>
              <span className={`clan-contrib-rank rank-${i + 1}`}>{i === 0 ? '①' : i === 1 ? '②' : '③'}</span>
              <div className="clan-contrib-avatar">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.username} />
                ) : (
                  <span>{member.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className="clan-contrib-name">{member.username}</span>
              <span className="clan-contrib-score">{member.clan_xp?.toLocaleString()} 🛡</span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER COLUMN */}
      <div className="clan-center">

        {/* Clan Crest Header */}
        <div className="clan-card clan-crest-card">
          <div className="clan-crest-header">
            <p className="clan-level-text">CLAN LEVEL {clan.level}</p>
            <div className="clan-crest-icon">
              {clan.crest_url ? (
                <img src={clan.crest_url} alt="Crest" />
              ) : (
                <span>🛡</span>
              )}
            </div>
            <div className="clan-xp-bar clan-xp-bar--center">
              <div className="clan-xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <p className="clan-xp-text">{clan.xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</p>
          </div>
          <div className="clan-perks">
            <p className="clan-perks-title">CLAN PERKS</p>
            <div className="clan-perk">🔄 +10% Clan XP Boost</div>
            <div className="clan-perk">🪙 +20% Gold from Battles</div>
            <div className="clan-perk">⚔️ +5% Damage in Clan Wars</div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="clan-activity">
          <p className="clan-section-title">CLAN ACTIVITY</p>
          <div className="clan-activity-grid">
            <div className="clan-activity-box">
              <span className="clan-activity-icon">⚔️</span>
              <p className="clan-activity-label">CLAN WARS</p>
              <p className="clan-activity-value">Active</p>
            </div>
            <div className="clan-activity-box">
              <span className="clan-activity-icon">🏆</span>
              <p className="clan-activity-label">CLAN RANK</p>
              <p className="clan-activity-value">#{clan.rank}</p>
            </div>
            <div className="clan-activity-box">
              <span className="clan-activity-icon">🛡</span>
              <p className="clan-activity-label">WEEKLY TROPHIES</p>
              <p className="clan-activity-value">🏆 {clan.weekly_trophies?.toLocaleString()}</p>
            </div>
            <div className="clan-activity-box">
              <span className="clan-activity-icon">👥</span>
              <p className="clan-activity-label">MEMBERS ONLINE</p>
              <p className="clan-activity-value">{onlineCount} 🟢</p>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="clan-card clan-members-card">
          <div className="clan-tabs">
            <button
              className={`clan-tab ${activeTab === 'members' ? 'clan-tab--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              MEMBERS
            </button>
            <button
              className={`clan-tab ${activeTab === 'pending' ? 'clan-tab--active' : ''}`}
              onClick={() => { setActiveTab('pending'); fetchJoinRequests(); }}
            >
              PENDING ({joinRequests.length})
            </button>
            <button
              className={`clan-tab ${activeTab === 'invites' ? 'clan-tab--active' : ''}`}
              onClick={() => setActiveTab('invites')}
            >
              INVITES
            </button>
          </div>

          {activeTab === 'members' && (
            <div className="clan-members-table">
              <div className="clan-members-header">
                <span>RANK</span>
                <span>MEMBER</span>
                <span>ROLE</span>
                <span>TROPHIES</span>
                <span>CLAN XP</span>
                <span>STATUS</span>
              </div>
              {members.map((member, i) => (
                <div className="clan-member-row" key={member.id}>
                  <span>{i + 1}</span>
                  <span className="clan-member-cell">
                    <div className="clan-member-avatar">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.username} />
                      ) : (
                        <span>{member.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    {member.username}
                  </span>
                  <span>{member.role}</span>
                  <span>{member.trophies?.toLocaleString()}</span>
                  <span>{member.clan_xp?.toLocaleString()}</span>
                  <span className={member.status === 'online' ? 'status-online' : ''}>
                    {member.status}
                  </span>
                  {(userRole === 'Leader' || userRole === 'Elder') && member.id !== user?.id && (
                    <div className="clan-member-actions">
                      {userRole === 'Leader' && member.role !== 'Elder' && (
                        <button className="clan-member-action-btn" onClick={() => handlePromote(member.id, 'Elder')} title="Promote to Elder">▲</button>
                      )}
                      {userRole === 'Leader' && member.role === 'Elder' && (
                        <button className="clan-member-action-btn" onClick={() => handlePromote(member.id, 'Member')} title="Demote to Member">▼</button>
                      )}
                      <button className="clan-member-action-btn clan-member-action-btn--kick" onClick={() => handleKick(member.id)} title="Kick member">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="clan-requests-list">
              {joinRequests.length === 0 && <div className="clan-empty-tab">No pending requests</div>}
              {joinRequests.map(req => (
                <div className="clan-request-row" key={req.id}>
                  <div className="clan-member-avatar">
                    {req.user?.avatar_url ? (
                      <img src={req.user.avatar_url} alt={req.user.username} />
                    ) : (
                      <span>{req.user?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="clan-request-info">
                    <p className="clan-request-name">{req.user?.username}</p>
                    <p className="clan-request-meta">Level {req.user?.level || 1} · {req.message || 'No message'}</p>
                  </div>
                  <div className="clan-request-actions">
                    <button className="clan-request-approve" onClick={() => handleApproveRequest(req.id)}>✓ Approve</button>
                    <button className="clan-request-deny" onClick={() => handleDenyRequest(req.id)}>✕ Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="clan-empty-tab">No pending invites</div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="clan-right">

        {/* Clan Chat */}
        <p className="clan-section-label">CLAN CHAT</p>
        <div className="clan-card clan-chat-card">
          <div className="clan-chat-messages">
            {chatMessages.length === 0 ? (
              <p className="clan-placeholder">No messages yet. Say hello!</p>
            ) : (
              chatMessages.map((msg, i) => (
                <div className="clan-chat-message" key={msg.id || i}>
                  <div className="clan-chat-avatar">
                    {msg.user?.avatar_url ? (
                      <img src={msg.user.avatar_url} alt={msg.user.username} />
                    ) : (
                      <span>{msg.user?.username?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="clan-chat-content">
                    <div className="clan-chat-meta">
                      <span className="clan-chat-username">{msg.user?.username || 'Unknown'}</span>
                      <span className="clan-chat-time">{formatTimeAgo(msg.created_at)}</span>
                    </div>
                    <p className="clan-chat-text">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="clan-chat-input-row">
            <input
              className="clan-chat-input"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="clan-chat-send" onClick={sendMessage}>➤</button>
          </div>
        </div>

        {/* Clan Quest - Placeholder */}
        <p className="clan-section-label">CLAN QUEST</p>
        <div className="clan-card clan-quest-card">
          <p className="clan-placeholder">Clan quests coming soon...</p>
        </div>

        {/* Clan Wars - Placeholder */}
        <p className="clan-section-label">CLAN WARS</p>
        <div className="clan-card clan-wars-card">
          <p className="clan-placeholder">Clan wars coming soon...</p>
        </div>
      </div>

    </div>
  );
}
