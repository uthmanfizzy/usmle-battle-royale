import { useState, useEffect, useMemo, useRef } from 'react';
import ProfileModal from './ProfileModal';
import { GroupGlyph } from './HomeGlyphs';
import './FriendsPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
const POLL_MS = 30000;

const MODE_LABELS = {
  battle_royale: 'Battle Royale',
  speed_race: 'Speed Race',
  trivia_pursuit: 'Trivia Pursuit',
  buzz_fun: 'Buzz Fun',
  scan_master: 'Scan Master',
  pvp_duel: 'PvP Duel',
  tower: 'Tower',
};

function lastOnline(iso) {
  const t = new Date(iso).getTime();
  if (!iso || !Number.isFinite(t)) return null;
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Last online just now';
  if (m < 60) return `Last online ${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `Last online ${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `Last online ${d}d ago`;
  return `Last online ${new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// ── Small line icons (stroke = currentColor) ──
const PersonPlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="8" r="4" fill="currentColor" stroke="none" />
    <path d="M2 21c0-4 3-7 7-7s7 3 7 7" fill="currentColor" stroke="none" />
    <path d="M19 8v6M16 11h6" />
  </svg>
);
const SearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" />
  </svg>
);
const ChatIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
);
const SwordsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 4l11 11M20 4L9 15M12.5 17.5l5-5M6.5 12.5l5 5M15.5 15.5l4 4M8.5 15.5l-4 4" />
  </svg>
);

function Avatar({ person }) {
  return (
    <span className="fp-avatar">
      {person?.avatar_url
        ? <img src={person.avatar_url} alt="" referrerPolicy="no-referrer" />
        : <span>{person?.username?.[0]?.toUpperCase() || '?'}</span>}
    </span>
  );
}

/**
 * Friends page (dashboard tab). Real data: accepted friendships, incoming
 * requests, user search / send request, accept / decline / remove, and live
 * presence from POST /api/users/online-status (online = has a live socket;
 * in match = that socket is in a started lobby).
 *
 * Chat and Invite are shown, per the design, as coming-soon: there is no
 * messaging system, and no invite delivery path clients listen for yet.
 */
export default function FriendsPage({ user, bannerArt }) {
  const [tab, setTab] = useState('friends');        // 'friends' | 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [presence, setPresence] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState(null);     // friendshipId whose ⋮ menu is open
  const [profile, setProfile] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadFriends = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/${user.id}`);
      const data = await res.json();
      setFriends((Array.isArray(data) ? data : []).map(f => ({
        friendshipId: f.id,
        ...(f.user_id === user.id ? f.friend : f.requester),
      })));
    } catch { setFriends([]); }
  };
  const loadRequests = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/requests/${user.id}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
  };

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([loadFriends(), loadRequests()]).finally(() => setLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Presence for the current friend list, refreshed while the page is open.
  const idsKey = friends.map(f => f.id).sort().join(',');
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/users/online-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: idsKey.split(',') }),
        });
        const data = await res.json();
        if (!cancelled) setPresence(data || {});
      } catch { /* keep last known */ }
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [idsKey]);

  // Close the ⋮ menu on any outside click.
  useEffect(() => {
    if (!menuFor) return;
    const close = (e) => { if (!e.target.closest('.fp-menu-wrap')) setMenuFor(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [menuFor]);

  const statusOf = (f) => {
    const p = presence[f.id];
    if (p?.inMatch) return { kind: 'match', label: 'In Match', sub: p.gameMode ? `In ${MODE_LABELS[p.gameMode] || 'a match'}` : null, rank: 0 };
    if (p?.online) return { kind: 'online', label: 'Online', sub: null, rank: 1 };
    return { kind: 'offline', label: 'Offline', sub: lastOnline(p?.lastSeen), rank: 2, seen: new Date(p?.lastSeen || 0).getTime() };
  };

  const q = query.trim().toLowerCase();
  const shownFriends = useMemo(() => friends
    .filter(f => !q || (f.username || '').toLowerCase().includes(q))
    .map(f => ({ ...f, status: statusOf(f) }))
    .sort((a, b) => a.status.rank - b.status.rank
      || (b.status.seen || 0) - (a.status.seen || 0)
      || (a.username || '').localeCompare(b.username || '')),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [friends, presence, q]);
  const shownRequests = requests.filter(r => !q || (r.requester?.username || '').toLowerCase().includes(q));

  const accept = async (id) => {
    try {
      await fetch(`${SERVER_URL}/api/friends/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id }),
      });
      flash('Friend added!');
      loadFriends(); loadRequests();
    } catch { flash('Could not accept that request.'); }
  };
  const decline = async (id) => {
    try { await fetch(`${SERVER_URL}/api/friends/${id}`, { method: 'DELETE' }); loadRequests(); }
    catch { flash('Could not decline that request.'); }
  };
  const remove = async (f) => {
    setMenuFor(null);
    if (!window.confirm(`Remove ${f.username} from your friends?`)) return;
    try {
      await fetch(`${SERVER_URL}/api/friends/${f.friendshipId}`, { method: 'DELETE' });
      flash('Friend removed');
      loadFriends();
    } catch { flash('Could not remove that friend.'); }
  };

  return (
    <div className="fp mv-plain">
      <div className="fp-titlebar">
        <h1 className="fp-title">Friends</h1>
        <button type="button" className="fp-add-btn" onClick={() => setShowAdd(true)}>
          <PersonPlusIcon className="fp-add-icon" /> Add Friends
        </button>
      </div>

      {toast && <div className="fp-toast" role="status">{toast}</div>}

      <div className="fp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'friends'}
          className={`fp-tab${tab === 'friends' ? ' is-active' : ''}`} onClick={() => setTab('friends')}>
          <GroupGlyph className="fp-tab-icon" color="currentColor" />
          <span>My Friends ({friends.length})</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'requests'}
          className={`fp-tab${tab === 'requests' ? ' is-active' : ''}`} onClick={() => setTab('requests')}>
          <PersonPlusIcon className="fp-tab-icon" />
          <span>Requests ({requests.length})</span>
          {requests.length > 0 && <span className="fp-tab-dot" aria-label="new requests" />}
        </button>
      </div>

      <label className="fp-search">
        <SearchIcon className="fp-search-icon" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tab === 'friends' ? 'Search friends...' : 'Search requests...'}
          aria-label="Search"
        />
      </label>

      <div className="fp-list">
        {loading ? (
          <div className="fp-empty">Loading…</div>
        ) : tab === 'friends' ? (
          shownFriends.length === 0 ? (
            <div className="fp-empty">
              {friends.length === 0
                ? <>No friends yet. <button type="button" className="fp-link" onClick={() => setShowAdd(true)}>Find some warriors</button></>
                : `No friends match "${query}"`}
            </div>
          ) : shownFriends.map(f => (
            <div className="fp-row" key={f.friendshipId}>
              <button type="button" className="fp-who" onClick={() => setProfile(f)} title="View profile">
                <Avatar person={f} />
                <span className="fp-who-text">
                  <span className="fp-name">{f.username}</span>
                  <span className={`fp-status fp-status--${f.status.kind}`}>
                    <span className="fp-status-dot" />{f.status.label}
                  </span>
                  {f.status.sub && <span className="fp-status-sub">{f.status.sub}</span>}
                </span>
              </button>

              <div className="fp-actions">
                <button type="button" className="fp-act" disabled title="Chat is coming soon">
                  <ChatIcon className="fp-act-icon" /><span className="fp-act-label">Chat</span>
                  <span className="fp-soon">Soon</span>
                </button>
                <button type="button" className="fp-act" disabled title="Game invites are coming soon">
                  <SwordsIcon className="fp-act-icon" /><span className="fp-act-label">Invite</span>
                  <span className="fp-soon">Soon</span>
                </button>
                <span className="fp-menu-wrap">
                  <button type="button" className="fp-more" aria-label={`More for ${f.username}`}
                    aria-expanded={menuFor === f.friendshipId}
                    onClick={() => setMenuFor(m => (m === f.friendshipId ? null : f.friendshipId))}>
                    <span /><span /><span />
                  </button>
                  {menuFor === f.friendshipId && (
                    <span className="fp-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => { setMenuFor(null); setProfile(f); }}>View profile</button>
                      <button type="button" role="menuitem" className="is-danger" onClick={() => remove(f)}>Remove friend</button>
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))
        ) : (
          shownRequests.length === 0 ? (
            <div className="fp-empty">{requests.length === 0 ? 'No pending requests' : `No requests match "${query}"`}</div>
          ) : shownRequests.map(r => (
            <div className="fp-row" key={r.id}>
              <button type="button" className="fp-who" onClick={() => setProfile(r.requester)} title="View profile">
                <Avatar person={r.requester} />
                <span className="fp-who-text">
                  <span className="fp-name">{r.requester?.username || 'Unknown'}</span>
                  <span className="fp-status-sub">Level {r.requester?.level || 1} · wants to be friends</span>
                </span>
              </button>
              <div className="fp-actions">
                <button type="button" className="fp-act fp-act--accept" onClick={() => accept(r.id)}>Accept</button>
                <button type="button" className="fp-act" onClick={() => decline(r.id)}>Decline</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`fp-banner${bannerArt ? ' has-art' : ''}`}>
        {bannerArt && <img className="fp-banner-art" src={bannerArt} alt="" loading="lazy" />}
        <div className="fp-banner-title">Friends make<br />stronger warriors</div>
        <div className="fp-banner-rule" aria-hidden="true"><span /><i>◇</i><span /></div>
        <div className="fp-banner-sub">Play together. Go further.</div>
      </div>

      {showAdd && <AddFriendsModal user={user} onClose={() => setShowAdd(false)} onSent={flash} friends={friends} />}
      {profile && <ProfileModal user={profile} onClose={() => setProfile(null)} />}
    </div>
  );
}

function AddFriendsModal({ user, onClose, onSent, friends }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState(() => new Set());
  const seq = useRef(0);
  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setSearching(false); return; }
    const mine = ++seq.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/users/search?q=${encodeURIComponent(term)}&currentUserId=${user.id}`);
        const data = await res.json();
        if (mine === seq.current) setResults(Array.isArray(data) ? data : []);
      } catch { if (mine === seq.current) setResults([]); }
      if (mine === seq.current) setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, user.id]);

  const send = async (target) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId: target.id }),
      });
      const data = await res.json();
      setSent(prev => new Set(prev).add(target.id));
      onSent(data.message || `Request sent to ${target.username}!`);
    } catch { onSent('Could not send that request.'); }
  };

  return (
    <div className="fp-modal-overlay mv-plain" onClick={onClose}>
      <div className="fp-modal" role="dialog" aria-modal="true" aria-label="Add friends" onClick={e => e.stopPropagation()}>
        <div className="fp-modal-head">
          <h2>Add Friends</h2>
          <button type="button" className="fp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <label className="fp-search">
          <SearchIcon className="fp-search-icon" />
          <input type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by username..." />
        </label>
        <div className="fp-modal-list">
          {q.trim().length < 2 ? (
            <div className="fp-empty">Type at least 2 characters</div>
          ) : searching ? (
            <div className="fp-empty">Searching…</div>
          ) : results.length === 0 ? (
            <div className="fp-empty">No warriors found for "{q.trim()}"</div>
          ) : results.map(r => (
            <div className="fp-row fp-row--compact" key={r.id}>
              <span className="fp-who">
                <Avatar person={r} />
                <span className="fp-who-text">
                  <span className="fp-name">{r.username}</span>
                  <span className="fp-status-sub">Level {r.level || 1}</span>
                </span>
              </span>
              {friendIds.has(r.id) ? (
                <span className="fp-pill">Friends</span>
              ) : sent.has(r.id) ? (
                <span className="fp-pill">Sent</span>
              ) : (
                <button type="button" className="fp-act fp-act--accept" onClick={() => send(r)}>Add</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
