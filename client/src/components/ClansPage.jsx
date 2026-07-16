import { useState, useEffect, useRef } from 'react';
import './ClansPage.css';
import CreateClanModal from './CreateClanModal';
import BrowseClansModal from './BrowseClansModal';
import ClanSettingsModal from './ClanSettingsModal';

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
  const [onlineStatus, setOnlineStatus] = useState({});
  const [clanQuests, setClanQuests] = useState([]);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [questForm, setQuestForm] = useState({
    name: '', description: '', type: 'damage',
    target: 1000, reward_gems: 50, reward_coins: 500,
    reward_xp: 1000, expires_hours: 168
  });
  const [showSettings, setShowSettings] = useState(false);
  const [memberSort, setMemberSort] = useState('clan_xp');
  const [memberSortDir, setMemberSortDir] = useState('desc');
  const [clanPerks, setClanPerks] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserClan();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (clan) {
      fetchClanQuests();
    }
  }, [clan]);

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

        // Fetch online status for all members
        fetchOnlineStatus(sortedMembers.map(m => m.id).filter(Boolean));
      }

      // Set clan perks from response or calculate from level
      if (data?.perks) {
        setClanPerks(data.perks);
      } else {
        setClanPerks(getClanPerksClient(data?.level || 1));
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

  const getClanPerksClient = (level) => {
    const allPerks = {
      1: [],
      2: [{ icon: '🔄', text: '+5% Clan XP Boost' }],
      3: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+10% Gold from Battles' }],
      4: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+20% Gold from Battles' }, { icon: '⚔️', text: '+5% Damage in Clan Wars' }],
      5: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+20% Gold from Battles' }, { icon: '⚔️', text: '+5% Damage in Clan Wars' }, { icon: '📋', text: '+1 Extra Daily Quest' }],
      6: [{ icon: '🔄', text: '+15% Clan XP Boost' }, { icon: '🪙', text: '+25% Gold from Battles' }, { icon: '⚔️', text: '+10% Damage in Clan Wars' }, { icon: '📋', text: '+2 Extra Daily Quests' }, { icon: '💎', text: '+5% Gem Drop Rate' }],
      7: [{ icon: '🔄', text: '+20% Clan XP Boost' }, { icon: '🪙', text: '+30% Gold from Battles' }, { icon: '⚔️', text: '+15% Damage in Clan Wars' }, { icon: '📋', text: '+2 Extra Daily Quests' }, { icon: '💎', text: '+10% Gem Drop Rate' }, { icon: '🛡', text: '+10% Defense Bonus' }],
    };
    return allPerks[Math.min(level || 1, 7)] || [];
  };

  const handleSort = (field) => {
    if (memberSort === field) {
      setMemberSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setMemberSort(field);
      setMemberSortDir('desc');
    }
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

  const fetchOnlineStatus = async (memberIds) => {
    if (!memberIds.length) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/users/online-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: memberIds })
      });
      const data = await res.json();
      setOnlineStatus(data);
    } catch(e) {
      console.error('Failed to fetch online status:', e);
    }
  };

  const fetchClanQuests = async () => {
    if (!clan) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/quests`);
      const data = await res.json();
      setClanQuests(data || []);
    } catch(e) {
      console.error('Failed to fetch clan quests:', e);
    }
  };

  const handleAddQuest = async () => {
    if (!questForm.name.trim()) return alert('Quest name is required');
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...questForm, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setClanQuests(prev => [data.quest, ...prev]);
        setShowAddQuest(false);
        setQuestForm({ name: '', description: '', type: 'damage', target: 1000, reward_gems: 50, reward_coins: 500, reward_xp: 1000, expires_hours: 168 });
      } else {
        alert(data.error || 'Failed to create quest');
      }
    } catch(e) {
      alert('Error creating quest');
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
  const onlineCount = members.filter(m => onlineStatus[m.id]?.online).length;

  const sortedMembers = [...members].sort((a, b) => {
    const dir = memberSortDir === 'desc' ? -1 : 1;
    if (memberSort === 'role') {
      const roleOrder = { Leader: 0, Elder: 1, Member: 2 };
      return dir * ((roleOrder[a.role] || 2) - (roleOrder[b.role] || 2));
    }
    if (memberSort === 'name') return dir * (a.username || '').localeCompare(b.username || '');
    return dir * ((a[memberSort] || 0) - (b[memberSort] || 0));
  });

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
            {/* Mockup value-over-label stat block. Total wins = sum of the
                members' wins already returned by /api/clans/:id (real data,
                not fabricated). Clan rank is NOT in the response — omitted. */}
            <div className="clan-stat-block">
              <span className="clan-stat-block-value">
                {members.reduce((sum, m) => sum + (m.wins || 0), 0).toLocaleString()}
              </span>
              <span className="clan-stat-block-label">TOTAL WINS</span>
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

          {userRole === 'Leader' && <button className="clan-settings-btn" onClick={() => setShowSettings(true)}>SETTINGS</button>}
          {userRole !== 'Leader' && (
            <button className="clan-leave-btn" onClick={handleLeave} disabled={leaving}>
              {leaving ? 'Leaving...' : '🚪 Leave Clan'}
            </button>
          )}
        </div>

        {showSettings && (
          <ClanSettingsModal
            clan={clan}
            user={user}
            onClose={() => setShowSettings(false)}
            onUpdated={(updatedClan) => {
              setClan(updatedClan);
              setShowSettings(false);
            }}
          />
        )}

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
            {clanPerks.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter,sans-serif', margin: '8px 0' }}>
                Reach Level 2 to unlock perks!
              </p>
            ) : (
              clanPerks.map((perk, i) => (
                <div className="clan-perk" key={i}>{perk.icon} {perk.text}</div>
              ))
            )}
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
                <span className="clan-sortable" onClick={() => handleSort('username')}>
                  MEMBER {memberSort === 'username' ? (memberSortDir === 'desc' ? '▼' : '▲') : ''}
                </span>
                <span className="clan-sortable" onClick={() => handleSort('role')}>
                  ROLE {memberSort === 'role' ? (memberSortDir === 'desc' ? '▼' : '▲') : ''}
                </span>
                <span className="clan-sortable" onClick={() => handleSort('trophies')}>
                  TROPHIES {memberSort === 'trophies' ? (memberSortDir === 'desc' ? '▼' : '▲') : ''}
                </span>
                <span className="clan-sortable" onClick={() => handleSort('clan_xp')}>
                  CLAN XP {memberSort === 'clan_xp' ? (memberSortDir === 'desc' ? '▼' : '▲') : ''}
                </span>
                <span>STATUS</span>
              </div>
              {sortedMembers.map((member, i) => (
                <div
                  className={`clan-member-row${member.id === user?.id ? ' clan-member-row--you' : ''}${member.role === 'Leader' ? ' clan-member-row--leader' : ''}`}
                  key={member.id}
                >
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
                  <span className={`clan-role clan-role--${(member.role || 'Member').toLowerCase()}`}>{member.role}</span>
                  <span>{member.trophies?.toLocaleString()}</span>
                  <span>{member.clan_xp?.toLocaleString()}</span>
                  <span className={onlineStatus[member.id]?.online ? 'status-online' : ''}>
                    {onlineStatus[member.id]?.online ? 'Online' : formatTimeAgo(onlineStatus[member.id]?.lastSeen || member.last_seen || new Date())}
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

        {/* Clan Quest - Real Data */}
        <p className="clan-section-label">CLAN QUESTS</p>
        <div className="clan-card clan-quest-card">
          {clanQuests.length === 0 && !showAddQuest && (
            <p className="clan-placeholder">No active quests</p>
          )}
          {clanQuests.slice(0, 2).map(quest => (
            <div className="clan-quest-content" key={quest.id}>
              <div className="clan-quest-icon">🎯</div>
              <div className="clan-quest-info">
                <p className="clan-quest-name">{quest.name}</p>
                <div className="clan-quest-bar">
                  <div className="clan-quest-fill" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} />
                </div>
                <p className="clan-quest-progress">{quest.progress.toLocaleString()} / {quest.target.toLocaleString()}</p>
                <p className="clan-quest-time">Expires: {new Date(quest.expires_at).toLocaleDateString()}</p>
              </div>
              <div className="clan-quest-reward">
                <span>💎 {quest.reward_gems}</span>
              </div>
            </div>
          ))}
          {['Leader', 'Elder'].includes(userRole) && (
            <button
              className="clan-green-btn clan-green-btn--full"
              onClick={() => setShowAddQuest(!showAddQuest)}
              style={{ marginTop: clanQuests.length > 0 ? '8px' : '0' }}
            >
              {showAddQuest ? '✕ Cancel' : '+ Add Quest'}
            </button>
          )}
          {showAddQuest && (
            <div className="clan-add-quest-form">
              <input className="create-clan-input" placeholder="Quest name" value={questForm.name} onChange={e => setQuestForm(f => ({ ...f, name: e.target.value }))} />
              <input className="create-clan-input" placeholder="Description (optional)" value={questForm.description} onChange={e => setQuestForm(f => ({ ...f, description: e.target.value }))} />
              <select className="create-clan-input" value={questForm.type} onChange={e => setQuestForm(f => ({ ...f, type: e.target.value }))}>
                <option value="damage">Deal Damage</option>
                <option value="wins">Win Matches</option>
                <option value="questions">Answer Questions</option>
                <option value="xp">Earn XP</option>
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="create-clan-input" type="number" placeholder="Target" value={questForm.target} onChange={e => setQuestForm(f => ({ ...f, target: parseInt(e.target.value) || 1000 }))} />
                <input className="create-clan-input" type="number" placeholder="Gem reward" value={questForm.reward_gems} onChange={e => setQuestForm(f => ({ ...f, reward_gems: parseInt(e.target.value) || 0 }))} />
              </div>
              <button className="clan-green-btn clan-green-btn--full" onClick={handleAddQuest}>Create Quest</button>
            </div>
          )}
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
