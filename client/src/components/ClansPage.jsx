import { useState, useEffect } from 'react';
import './ClansPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function ClansPage({ user }) {
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    // TODO: Fetch user's clan data
    // For now, using placeholder data
    setLoading(false);

    // Placeholder clan data
    setClan({
      id: 1,
      name: 'ROYAL GUARDIANS',
      tag: 'RGD',
      description: 'Elite medical warriors unite!',
      level: 5,
      xp: 15780,
      members_count: 48,
      banner_url: null,
      crest_url: null,
      location: 'Global',
      type: 'Open',
      required_trophies: 1500,
      weekly_trophies: 12560,
      rank: 152
    });

    // Placeholder members
    setMembers([
      { id: 1, username: user?.username || 'You', role: 'Leader', level: 15, xp: 5000, clan_xp: 2500, trophies: 3200, status: 'online', avatar_url: user?.avatar_url },
      { id: 2, username: 'DrMedic', role: 'Elder', level: 12, xp: 3500, clan_xp: 2100, trophies: 2800, status: 'online', avatar_url: null },
      { id: 3, username: 'Healer99', role: 'Member', level: 10, xp: 2800, clan_xp: 1800, trophies: 2400, status: '2h ago', avatar_url: null },
    ]);
  }, [user]);

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
        <button className="clan-action-btn">Browse Clans</button>
        <button className="clan-action-btn clan-action-btn--create">Create Clan</button>
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

          <button className="clan-settings-btn">SETTINGS</button>
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
              onClick={() => setActiveTab('pending')}
            >
              PENDING (0)
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
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="clan-empty-tab">No pending requests</div>
          )}

          {activeTab === 'invites' && (
            <div className="clan-empty-tab">No pending invites</div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="clan-right">

        {/* Clan Chat - Placeholder */}
        <p className="clan-section-label">CLAN CHAT</p>
        <div className="clan-card clan-chat-card">
          <div className="clan-chat-messages">
            <p className="clan-placeholder">Chat feature coming soon...</p>
          </div>
          <div className="clan-chat-input-row">
            <input className="clan-chat-input" placeholder="Type a message..." disabled />
            <button className="clan-chat-send" disabled>➤</button>
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
