import { useState, useEffect } from 'react';
import './ClansPage.css';
import CreateClanModal from './CreateClanModal';
import BrowseClansModal from './BrowseClansModal';
import ClanSettingsModal from './ClanSettingsModal';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Roles come back in mixed casing / legacy names; normalize to the three real
// display roles (Elder is the real name — NOT "Officer", per an earlier decision).
const ROLE_ORDER = { Leader: 0, Elder: 1, Member: 2 };
function normalizeRole(r) {
  const s = (r || '').toLowerCase();
  if (s === 'leader' || s === 'owner') return 'Leader';
  if (s === 'elder' || s === 'officer') return 'Elder';
  return 'Member';
}

export default function ClansPage({ user }) {
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('Member');
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'browse'
  const [leaving, setLeaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Browse Clans tab (inline list — same glass-row language as the Roster)
  const [browseClans, setBrowseClans] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [joining, setJoining] = useState({});
  const [joinMsg, setJoinMsg] = useState({});

  useEffect(() => {
    if (user?.id) fetchUserClan();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'browse') fetchBrowseClans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUserClan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/user/${user.id}`);
      const clanData = await res.json();
      if (clanData) {
        setClan(clanData);
        await fetchClanDetails(clanData.id);
      } else {
        setClan(null);
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
        const mapped = data.members.map(m => ({
          ...m.user,
          role: normalizeRole(m.role),
          wins: m.user?.wins || 0,
          level: m.user?.level || 1,
        }));
        // Leader → Elder → Member, then most wins first
        mapped.sort((a, b) => (ROLE_ORDER[a.role] - ROLE_ORDER[b.role]) || (b.wins - a.wins));
        setMembers(mapped);
        const me = data.members.find(m => (m.user_id || m.user?.id) === user.id);
        if (me) setUserRole(normalizeRole(me.role));
      }
    } catch (e) {
      console.error('Failed to fetch clan details:', e);
    }
  };

  const fetchBrowseClans = async () => {
    setBrowseLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/clans?sort=score`);
      const data = await res.json();
      setBrowseClans(data.clans || []);
    } catch (e) {
      console.error('Failed to browse clans:', e);
    }
    setBrowseLoading(false);
  };

  // Same join flow BrowseClansModal uses: /request auto-joins Open clans,
  // otherwise files a join request.
  const handleJoinBrowse = async (c) => {
    setJoining(p => ({ ...p, [c.id]: true }));
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${c.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      setJoinMsg(p => ({
        ...p,
        [c.id]: data.message || (data.joined ? 'Joined!' : data.success ? 'Requested' : (data.error || 'Failed')),
      }));
      if (data.joined) {
        setActiveTab('my');
        await fetchUserClan();
      }
    } catch (e) {
      setJoinMsg(p => ({ ...p, [c.id]: 'Error joining clan' }));
    }
    setJoining(p => ({ ...p, [c.id]: false }));
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this clan?')) return;
    setLeaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}/members/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setClan(null);
        setMembers([]);
        setActiveTab('my');
      } else {
        alert(data.error || 'Failed to leave clan');
      }
    } catch (e) {
      alert('Error leaving clan');
    }
    setLeaving(false);
  };

  if (loading) {
    return (
      <div className="clan-loading">
        <p>Loading clan data...</p>
      </div>
    );
  }

  // ── No-clan entry state (preserved unchanged: Browse / Create modals) ──
  if (!clan) {
    return (
      <div className="cp">
        <div className="cp-col">
          <h1 className="cp-title">Clans</h1>
          <p className="cp-subtitle">Fight together. Rise together.</p>
          <div className="clan-no-clan">
            <h2>You are not in a clan</h2>
            <p>Join or create a clan to compete with others!</p>
            <button className="clan-action-btn" onClick={() => setShowBrowse(true)}>🔍 Browse Clans</button>
            <button className="clan-action-btn clan-action-btn--create" onClick={() => setShowCreate(true)}>⚔️ Create Clan</button>
          </div>
        </div>
        {showCreate && <CreateClanModal user={user} onClose={() => setShowCreate(false)} onCreated={(c) => { setClan(c); fetchClanDetails(c.id); }} />}
        {showBrowse && <BrowseClansModal user={user} onClose={() => setShowBrowse(false)} onJoined={(c) => { setClan(c); setShowBrowse(false); fetchClanDetails(c.id); }} />}
      </div>
    );
  }

  const totalWins = members.reduce((sum, m) => sum + (m.wins || 0), 0);
  const crestLetter = (clan.tag || clan.name || 'C').trim()[0]?.toUpperCase() || 'C';

  return (
    <div className="cp">
      <div className="cp-col">
        <h1 className="cp-title">Clans</h1>
        <p className="cp-subtitle">Fight together. Rise together.</p>

        {/* Tabs */}
        <div className="cp-tabs">
          <button
            type="button"
            className={`cp-tab ${activeTab === 'my' ? 'cp-tab--active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Clan
          </button>
          <button
            type="button"
            className={`cp-tab ${activeTab === 'browse' ? 'cp-tab--active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Clans
          </button>
        </div>

        {activeTab === 'my' && (
          <>
            {/* Clan header card */}
            <div className="cp-header-card">
              <div className="cp-header-top">
                <div className="cp-crest" aria-hidden="true"><span className="cp-crest-letter">{crestLetter}</span></div>
                <div className="cp-header-info">
                  <div className="cp-name-row">
                    <span className="cp-name">{clan.name}</span>
                    <span className="cp-nametag">[{clan.tag}] · Lvl. {clan.level}</span>
                  </div>
                  <p className="cp-motto">&ldquo;{clan.description || 'No motto set.'}&rdquo;</p>
                </div>
              </div>

              {/* Members + Total Wins only — Clan Rank omitted (no real data) */}
              <div className="cp-stats">
                <div className="cp-stat">
                  <span className="cp-stat-value">{members.length}</span>
                  <span className="cp-stat-label">MEMBERS</span>
                </div>
                <div className="cp-stat">
                  <span className="cp-stat-value">{totalWins.toLocaleString()}</span>
                  <span className="cp-stat-label">TOTAL WINS</span>
                </div>
              </div>

              {/* Subtle management links (no mockup element for these) */}
              <div className="cp-header-actions">
                {userRole === 'Leader' && (
                  <button type="button" className="cp-text-link" onClick={() => setShowSettings(true)}>
                    Settings
                  </button>
                )}
                <button type="button" className="cp-text-link cp-text-link--leave" onClick={handleLeave} disabled={leaving}>
                  {leaving ? 'Leaving…' : 'Leave clan'}
                </button>
              </div>
            </div>

            {/* Roster */}
            <h2 className="cp-roster-head">Roster</h2>
            <div className="cp-roster">
              {members.map(m => {
                const you = m.id === user?.id;
                const role = m.role.toLowerCase();
                return (
                  <div className={`cp-row cp-row--${role}${you ? ' cp-row--you' : ''}`} key={m.id}>
                    <div className="cp-avatar">
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.username} referrerPolicy="no-referrer" />
                        : <span>{m.username?.[0]?.toUpperCase() || '?'}</span>}
                    </div>
                    <div className="cp-row-info">
                      <span className="cp-row-name">{m.username}{you ? ' (You)' : ''}</span>
                      <span className="cp-row-level">Lvl. {m.level}</span>
                    </div>
                    <span className="cp-row-role">{m.role}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'browse' && (
          <div className="cp-roster cp-browse">
            {browseLoading && <p className="cp-empty">Loading clans…</p>}
            {!browseLoading && browseClans.length === 0 && <p className="cp-empty">No clans found</p>}
            {browseClans.map(c => (
              <div className="cp-row cp-browse-row" key={c.id}>
                <div className="cp-avatar cp-avatar--clan" aria-hidden="true">
                  {(c.tag || c.name || 'C').trim()[0]?.toUpperCase() || 'C'}
                </div>
                <div className="cp-row-info">
                  <span className="cp-row-name">
                    {c.name} <span className="cp-browse-tag">[{c.tag}]</span>
                  </span>
                  <span className="cp-row-level">
                    Lvl. {c.level || 1} · {c.member_count?.[0]?.count || 0}/50 members
                  </span>
                </div>
                {joinMsg[c.id] ? (
                  <span className="cp-join-msg">{joinMsg[c.id]}</span>
                ) : (
                  <button
                    type="button"
                    className="cp-join-btn"
                    onClick={() => handleJoinBrowse(c)}
                    disabled={joining[c.id]}
                  >
                    {joining[c.id] ? '…' : (c.type === 'Open' ? 'JOIN' : 'REQUEST')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <ClanSettingsModal
          clan={clan}
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdated={(updatedClan) => { setClan(updatedClan); setShowSettings(false); }}
        />
      )}
    </div>
  );
}
