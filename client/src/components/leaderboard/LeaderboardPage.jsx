import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '../../auth';
import ProfileModal, { formatStudyTime } from '../ProfileModal';
import './LeaderboardPage.css';

/**
 * The dashboard's Leaderboards page.
 *
 * Every board comes back from the server in one shape — { players, total, me }
 * (see the "Leaderboard boards" block in server/index.js) — so a board here is
 * only configuration: where to fetch it, which number it ranks by, and which
 * supporting numbers sit beside it. The page draws a podium for the top three,
 * the caller's own standing (rank, percentile, and the gap to the player just
 * above), and the rest of the field as rows with a bar scaled to the leader.
 */

const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (n) => `${Math.round(Number(n) || 0)}%`;
const plural = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;

const BOARDS = [
  {
    id: 'global',
    label: 'Global',
    icon: '🌍',
    blurb: 'Total XP earned from matches and quests.',
    url: () => '/api/leaderboard/players',
    value: (p) => p.xp,
    show: (v) => num(v),
    unit: 'XP',
    gap: (d) => `${num(d)} XP`,
    stats: [
      { label: 'Wins', get: (p) => num(p.games_won) },
      { label: 'Win rate', get: (p) => pct(p.win_rate) },
      { label: 'Study', get: (p) => formatStudyTime(p.total_study_seconds) },
    ],
    empty: 'Nobody has earned XP yet.',
    join: 'Play a ranked match or finish a quest to earn XP and get on the board.',
  },
  {
    id: 'wins',
    label: 'Victories',
    icon: '⚔️',
    blurb: 'Matches won. The same wins from fewer games ranks higher.',
    url: () => '/api/leaderboard/players?sort=wins',
    value: (p) => p.games_won,
    show: (v) => num(v),
    unit: 'wins',
    gap: (d) => plural(d, 'win'),
    stats: [
      { label: 'Played', get: (p) => num(p.games_played) },
      { label: 'Win rate', get: (p) => pct(p.win_rate) },
      { label: 'XP', get: (p) => num(p.xp) },
    ],
    empty: 'No one has won a match yet.',
    join: 'Win an online match to get on this board.',
  },
  {
    id: 'study',
    label: 'Study',
    icon: '📚',
    blurb: 'Active study time across every mode.',
    periods: [
      { id: 'week', label: 'This week' },
      { id: 'month', label: '30 days' },
      { id: 'all', label: 'All time' },
    ],
    url: (period) => `/api/leaderboard/study?period=${period}`,
    value: (p) => p.study_seconds,
    show: (v) => formatStudyTime(v),
    unit: 'studied',
    gap: (d) => formatStudyTime(Math.max(60, d)),
    stats: [
      { label: 'Days', get: (p) => num(p.study_days) },
      { label: 'Per day', get: (p) => formatStudyTime(p.study_days ? p.study_seconds / p.study_days : 0) },
    ],
    empty: 'No study time logged in this window yet.',
    join: 'Answer questions in any mode and your study time is counted automatically.',
  },
  {
    id: 'journey',
    label: 'Journey',
    icon: '🚑',
    blurb: 'First Aid Journey levels completed, then average best score.',
    url: () => '/api/leaderboard/journey',
    value: (p) => p.levels_completed,
    show: (v) => num(v),
    unit: 'levels',
    gap: (d) => plural(d, 'level'),
    stats: [{ label: 'Avg score', get: (p) => pct(p.avg_score) }],
    empty: 'No one has completed a Journey level yet.',
    join: 'Complete a First Aid Journey level to get ranked.',
  },
  {
    id: 'smle',
    label: 'Saudi MLE',
    icon: '📗',
    blurb: 'Distinct Saudi MLE questions answered, then accuracy.',
    url: () => '/api/leaderboard/saudi-mle',
    value: (p) => p.questions_answered,
    show: (v) => num(v),
    unit: 'questions',
    gap: (d) => plural(d, 'question'),
    stats: [{ label: 'Accuracy', get: (p) => pct(p.accuracy) }],
    empty: 'No one has answered a Saudi MLE question yet.',
    join: 'Answer Saudi MLE questions to get ranked.',
  },
  {
    id: 'friends',
    label: 'Friends',
    icon: '👥',
    blurb: 'You and your friends, ranked by XP.',
    url: () => '/api/leaderboard/friends',
    value: (p) => p.xp,
    show: (v) => num(v),
    unit: 'XP',
    gap: (d) => `${num(d)} XP`,
    stats: [
      { label: 'Wins', get: (p) => num(p.games_won) },
      { label: 'Win rate', get: (p) => pct(p.win_rate) },
      { label: 'Study', get: (p) => formatStudyTime(p.total_study_seconds) },
    ],
    empty: 'Add friends to see how you stack up against them.',
    join: 'Add friends to see how you stack up against them.',
  },
];

const BOARD_KEY = 'mv.leaderboard.board';
const PERIOD_KEY = 'mv.leaderboard.period';
const CACHE_MS = 60 * 1000;
const FIRST_PAGE = 17; // rows under the podium before "Show all"

function readPref(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch { return fallback; }
}
function writePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

function Avatar({ player, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`lbx-avatar lbx-avatar--${size}`}>
      {player.avatar_url && !broken
        ? <img src={player.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        : <span className="lbx-avatar-initial">{player.username?.[0]?.toUpperCase() || '?'}</span>}
      <span className="lbx-avatar-level" title={`Level ${player.level || 1}`}>{player.level || 1}</span>
    </span>
  );
}

function Podium({ players, board, meId, onOpen }) {
  // Second, first, third — the classic stepped order, winner in the middle.
  const slots = [players[1], players[0], players[2]];
  return (
    <div className="lbx-podium" role="list" aria-label="Top three">
      {slots.map((p, i) => {
        if (!p) return <div key={`empty-${i}`} className="lbx-podium-slot lbx-podium-slot--empty" aria-hidden="true" />;
        return (
          <button
            key={p.id}
            type="button"
            role="listitem"
            className={`lbx-podium-slot lbx-podium-slot--${p.rank}${p.id === meId ? ' lbx-is-me' : ''}`}
            onClick={() => onOpen(p)}
            aria-label={`Rank ${p.rank}, ${p.username}, ${board.show(board.value(p))} ${board.unit}`}
          >
            {p.rank === 1 && <span className="lbx-crown" aria-hidden="true">👑</span>}
            <Avatar player={p} size={p.rank === 1 ? 'xl' : 'lg'} />
            <span className="lbx-podium-name">
              {p.username}
              {p.id === meId && <span className="lbx-you">You</span>}
            </span>
            {p.clan_tag && <span className="lbx-tag">[{p.clan_tag}]</span>}
            <span className="lbx-podium-value">
              {board.show(board.value(p))}
              <small>{board.unit}</small>
            </span>
            <span className="lbx-pedestal"><span>{p.rank}</span></span>
          </button>
        );
      })}
    </div>
  );
}

function Standing({ data, board, user, onJump, onOpen }) {
  const me = data?.me;
  if (!me) {
    return (
      <div className="lbx-standing lbx-standing--unranked">
        <Avatar player={user} size="md" />
        <div className="lbx-standing-text">
          <span className="lbx-standing-kicker">Your standing</span>
          <strong>Not ranked yet</strong>
          <span className="lbx-standing-sub">{board.join}</span>
        </div>
      </div>
    );
  }

  const players = data.players || [];
  const above = me.rank > 1 ? players.find(p => p.rank === me.rank - 1) : null;
  const gap = above ? board.value(above) - board.value(me) : 0;
  const inList = players.some(p => p.id === me.id);
  const top = data.total >= 10 ? Math.max(1, Math.ceil((me.rank / data.total) * 100)) : null;

  let chase;
  if (me.rank === 1) chase = data.total > 1 ? 'You lead this board. Hold the line.' : 'You are the only one here so far.';
  else if (above && gap > 0) chase = <>{board.gap(gap)} to pass <b>{above.username}</b></>;
  else if (above) chase = <>Level with <b>{above.username}</b>, so the tie-break decides it</>;
  else chase = `${num(me.rank - 1)} players ahead of you`;

  return (
    <div className="lbx-standing">
      <button type="button" className="lbx-standing-face" onClick={() => onOpen(me)} aria-label="Open your profile">
        <Avatar player={me} size="md" />
      </button>
      <div className="lbx-standing-text">
        <span className="lbx-standing-kicker">Your standing</span>
        <strong>
          #{num(me.rank)}
          <span className="lbx-standing-of"> of {num(data.total)}</span>
          {top !== null && top <= 50 && <span className="lbx-standing-top">Top {top}%</span>}
        </strong>
        <span className="lbx-standing-sub">{chase}</span>
      </div>
      <div className="lbx-standing-metric">
        <span>{board.show(board.value(me))}</span>
        <small>{board.unit}</small>
      </div>
      {inList && me.rank > 3 && (
        <button type="button" className="lbx-jump" onClick={onJump}>Find me ↓</button>
      )}
    </div>
  );
}

function Row({ p, board, isMe, max, onOpen, index, rowRef }) {
  const v = board.value(p) || 0;
  const width = max > 0 ? Math.max(3, Math.round((v / max) * 100)) : 0;
  return (
    <button
      ref={rowRef}
      type="button"
      className={`lbx-row${isMe ? ' lbx-is-me' : ''}`}
      style={{ '--i': Math.min(index, 20) }}
      onClick={() => onOpen(p)}
    >
      <span className="lbx-row-rank">{p.rank}</span>
      <Avatar player={p} size="sm" />
      <span className="lbx-row-who">
        <span className="lbx-row-name">
          {p.username}
          {p.clan_tag && <span className="lbx-tag">[{p.clan_tag}]</span>}
          {isMe && <span className="lbx-you">You</span>}
        </span>
        <span className="lbx-row-stats">
          {board.stats.map(s => (
            <span key={s.label}><em>{s.label}</em> {s.get(p)}</span>
          ))}
        </span>
      </span>
      <span className="lbx-row-metric">
        <span className="lbx-row-value">{board.show(v)} <small>{board.unit}</small></span>
        <span className="lbx-bar" aria-hidden="true"><span style={{ width: `${width}%` }} /></span>
      </span>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="lbx-skeleton" aria-hidden="true">
      <div className="lbx-skel-podium">
        <span /><span /><span />
      </div>
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="lbx-skel-row" />)}
    </div>
  );
}

export default function LeaderboardPage({ user }) {
  const userId = user?.id;
  const [boardId, setBoardId] = useState(() => readPref(BOARD_KEY, 'global', BOARDS.map(b => b.id)));
  const [period, setPeriod] = useState(() => readPref(PERIOD_KEY, 'week', ['week', 'month', 'all']));
  const [state, setState] = useState({ status: 'loading', data: null, key: null });
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const cache = useRef(new Map()); // fetch key → { at, data }
  const meRowRef = useRef(null);

  const board = BOARDS.find(b => b.id === boardId) || BOARDS[0];
  const fetchKey = board.periods ? `${board.id}:${period}` : board.id;

  const load = useCallback(async (force = false) => {
    const key = fetchKey;
    const hit = cache.current.get(key);
    if (!force && hit && Date.now() - hit.at < CACHE_MS) {
      setState({ status: 'ready', data: hit.data, key });
      return;
    }
    setState(s => ({ status: 'loading', data: s.key === key ? s.data : null, key }));
    try {
      const res = await authFetch(board.url(period));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = {
        players: Array.isArray(json.players) ? json.players : [],
        total: Number(json.total) || (json.players || []).length,
        me: json.me || null,
      };
      cache.current.set(key, { at: Date.now(), data });
      // Ignore a response for a board the reader has already left.
      setState(s => (s.key === key ? { status: 'ready', data, key } : s));
    } catch (err) {
      console.error('[leaderboard] load failed', err);
      setState(s => (s.key === key ? { status: 'error', data: null, key } : s));
    }
  }, [fetchKey, board, period]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShowAll(false); setQuery(''); }, [fetchKey]);

  const pickBoard = (id) => { setBoardId(id); writePref(BOARD_KEY, id); };
  const pickPeriod = (id) => { setPeriod(id); writePref(PERIOD_KEY, id); };

  const data = state.data;
  const players = data?.players || [];
  const max = players.length ? Math.max(...players.map(p => board.value(p) || 0)) : 0;
  const searching = query.trim().length > 0;

  const rest = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return players.filter(p => p.username?.toLowerCase().includes(q));
    return players.slice(3);
  }, [players, query]);
  const visible = searching || showAll ? rest : rest.slice(0, FIRST_PAGE);
  const meInHidden = !searching && !showAll && rest.slice(FIRST_PAGE).some(p => p.id === userId);

  const jumpToMe = () => {
    if (meInHidden) setShowAll(true);
    setQuery('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      meRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      meRowRef.current?.focus({ preventScroll: true });
    }));
  };

  return (
    <div className="lb-page lbx">
      <header className="lbx-hero">
        <span className="lbx-hero-kicker">Hall of Physicians</span>
        <h1 className="lbx-title">Leaderboards</h1>
        <p className="lbx-blurb">{board.blurb}</p>
      </header>

      <nav className="lbx-boards" aria-label="Choose a leaderboard">
        {BOARDS.map(b => (
          <button
            key={b.id}
            type="button"
            className={`lbx-board${b.id === boardId ? ' lbx-board--on' : ''}`}
            aria-pressed={b.id === boardId}
            onClick={() => pickBoard(b.id)}
          >
            <span className="lbx-board-icon" aria-hidden="true">{b.icon}</span>
            {b.label}
          </button>
        ))}
      </nav>

      <div className="lbx-toolbar">
        {board.periods ? (
          <div className="lbx-periods" role="group" aria-label="Time window">
            {board.periods.map(pr => (
              <button
                key={pr.id}
                type="button"
                className={`lbx-period${pr.id === period ? ' lbx-period--on' : ''}`}
                aria-pressed={pr.id === period}
                onClick={() => pickPeriod(pr.id)}
              >{pr.label}</button>
            ))}
          </div>
        ) : (
          <span className="lbx-count">
            {data && state.status === 'ready' ? `${plural(data.total, 'player')} ranked` : ' '}
          </span>
        )}
        <div className="lbx-tools">
          <label className="lbx-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Find a player"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Find a player on this board"
            />
          </label>
          <button
            type="button"
            className={`lbx-refresh${state.status === 'loading' ? ' lbx-refresh--spin' : ''}`}
            onClick={() => load(true)}
            aria-label="Refresh"
            title="Refresh"
          >↻</button>
        </div>
      </div>

      {state.status === 'error' ? (
        <div className="lbx-empty">
          <span className="lbx-empty-icon" aria-hidden="true">⚠️</span>
          <p>This board could not be loaded.</p>
          <button type="button" className="lbx-retry" onClick={() => load(true)}>Try again</button>
        </div>
      ) : !data ? (
        <Skeleton />
      ) : (
        <div className={`lbx-content${state.status === 'loading' ? ' lbx-content--stale' : ''}`}>
          <Standing data={data} board={board} user={user} onJump={jumpToMe} onOpen={setProfileUser} />

          {players.length === 0 ? (
            <div className="lbx-empty">
              <span className="lbx-empty-icon" aria-hidden="true">{board.icon}</span>
              <p>{board.empty}</p>
            </div>
          ) : (
            <>
              {!searching && <Podium players={players} board={board} meId={userId} onOpen={setProfileUser} />}

              {(visible.length > 0 || searching) && (
                <div className="lbx-list">
                  {visible.map((p, i) => (
                    <Row
                      key={p.id}
                      p={p}
                      board={board}
                      isMe={p.id === userId}
                      max={max}
                      index={i}
                      onOpen={setProfileUser}
                      rowRef={p.id === userId ? meRowRef : undefined}
                    />
                  ))}
                  {searching && visible.length === 0 && (
                    <p className="lbx-nomatch">No one called “{query.trim()}” in the top {num(players.length)}.</p>
                  )}
                </div>
              )}

              {!searching && !showAll && rest.length > FIRST_PAGE && (
                <button type="button" className="lbx-more" onClick={() => setShowAll(true)}>
                  Show all top {num(players.length)}
                </button>
              )}
            </>
          )}
        </div>
      )}

      <p className="lbx-foot">Tap any player to see their profile. Boards update every couple of minutes.</p>

      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
    </div>
  );
}
